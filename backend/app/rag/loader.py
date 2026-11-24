"""Extract factual, topic-specific documents from the same JSON Angular uses."""

import hashlib
import json
import re
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker
from langchain_core.documents import Document

from app.config import Settings
from app.rag.errors import RagError


def content_snapshot(settings: Settings) -> tuple[dict[str, Any], str]:
    try:
        content = json.loads(
            (settings.content_dir / "portfolio.json").read_text(encoding="utf-8")
        )
        schema = json.loads(
            (settings.content_dir / "portfolio.schema.json").read_text(encoding="utf-8")
        )
    except (OSError, ValueError) as error:
        raise RagError(
            "Cannot read portfolio JSON and schema from PORTFOLIO_CONTENT_DIR.",
            code="invalid_content",
        ) from error
    errors = sorted(
        Draft202012Validator(schema, format_checker=FormatChecker()).iter_errors(
            content
        ),
        key=lambda item: str(item.json_path),
    )
    if errors:
        raise RagError(
            f"Portfolio content does not match its schema at {errors[0].json_path}.",
            status_code=422,
            code="invalid_content",
        )
    for field in ("skills", "experience", "projectGroups", "projects", "education"):
        ids = [item["id"] for item in content[field]]
        if len(ids) != len(set(ids)):
            raise RagError(
                f"Duplicate IDs in portfolio {field}.",
                status_code=422,
                code="invalid_content",
            )
    slugs = [item["slug"] for item in content["projects"]]
    groups = {item["id"] for item in content["projectGroups"]}
    projects = {item["id"] for item in content["projects"]}
    if len(slugs) != len(set(slugs)) or any(
        item["groupId"] not in groups for item in content["projects"]
    ):
        raise RagError(
            "Project slugs must be unique and project groups must exist.",
            status_code=422,
            code="invalid_content",
        )
    for role in content["experience"]:
        if any(
            project_id not in projects
            for project_id in role.get("relatedProjectIds", [])
        ):
            raise RagError(
                "An experience record references an unknown project.",
                status_code=422,
                code="invalid_content",
            )
    canonical = json.dumps(
        content, ensure_ascii=False, sort_keys=True, separators=(",", ":")
    )
    return content, hashlib.sha256(canonical.encode()).hexdigest()


def plain_text(nodes: list[dict[str, Any]]) -> str:
    """Preserve inline words and block/list boundaries; discard presentation markup."""

    def render(node: dict[str, Any]) -> str:
        if "text" in node:
            return node["text"]
        tag = node.get("tag", "")
        body = "".join(render(child) for child in node.get("children", []))
        if tag == "br":
            return "\n"
        if tag == "li":
            return f"\n- {body.strip()}\n"
        if tag in {"p", "div", "section", "h5", "h6", "ul", "ol"}:
            return f"\n{body.strip()}\n"
        return body

    text = "".join(render(node) for node in nodes)
    return re.sub(r"\n{3,}", "\n\n", re.sub(r"[ \t]+", " ", text)).strip()


def load_documents(settings: Settings, content: dict[str, Any]) -> list[Document]:
    documents: list[Document] = []
    owner = content["profile"]["name"]

    def add(
        document_id: str,
        title: str,
        content_type: str,
        section: str,
        body: str,
        url: str,
        **extra: str,
    ) -> None:
        if body.strip():
            documents.append(
                Document(
                    page_content=body,
                    metadata={
                        "document_id": document_id,
                        "title": title,
                        "content_type": content_type,
                        "section": section,
                        "source_url": url,
                        "owner": owner,
                        "source_file": "content/portfolio.json",
                        **extra,
                    },
                )
            )

    profile = content["profile"]
    profile_body = [
        profile["headline"],
        profile["summary"],
        f"Location: {profile['location']}",
        f"Role focus: {', '.join(profile['roleFocus'])}",
        plain_text(profile["focus"]),
    ]
    profile_body.extend(
        f"{item['value']}{item.get('suffix', '')}: {item['label']}"
        for item in profile.get("impact", [])
    )
    profile_body.extend(f"{link['label']}: {link['url']}" for link in profile["links"])
    add(
        "profile",
        owner,
        "profile",
        "profile",
        "\n".join(profile_body),
        settings.site_url + "#hero-title",
    )
    for skill in content["skills"]:
        add(
            f"skill:{skill['id']}",
            skill["label"],
            "skill",
            "skills",
            skill["description"],
            settings.site_url + "#toolkit-title",
        )
    for role in content["experience"]:
        title = f"{role['role']} at {role['company']}"
        body = f"Employment dates: {role['startDate']} to {role['endDate'] or 'Present'}\n{plain_text(role['description'])}"
        if role.get("relatedProjectIds"):
            body += "\nRelated documented projects: " + ", ".join(
                role["relatedProjectIds"]
            )
        add(
            f"experience:{role['id']}",
            title,
            "experience",
            "experience",
            body,
            settings.site_url + "#experience",
            company=role["company"],
            technologies=", ".join(role["technologies"]),
        )
    for project in content["projects"]:
        url = settings.site_url + f"projects/{project['slug']}"
        extra = {
            "technologies": ", ".join(project["technologies"]),
            "project_kind": project["kind"],
        }
        summary = f"Type: {project['kind']}\n{project['summary']}"
        summary += "\n" + "\n".join(
            f"{link['label']}: {link['url']}" for link in project.get("links", [])
        )
        add(
            f"project:{project['id']}",
            project["title"],
            "project",
            "summary",
            summary,
            url,
            **extra,
        )
        for position, block in enumerate(project.get("details", [])):
            add(
                f"project:{project['id']}",
                project["title"],
                "project",
                f"details-{position + 1}",
                plain_text([block]),
                url,
                **extra,
            )
    for education in content["education"]:
        body = f"{education['degree']} in {education['field']}\n{education['institution']}\nGraduated: {education['graduationYear']}"
        if education.get("grade") is not None:
            body += f"\nGrade: {education['grade']}/{education['gradeScale']}"
        add(
            f"education:{education['id']}",
            education["institution"],
            "education",
            "education",
            body,
            settings.site_url + "#beyond",
        )
    personal = content["additionalInformation"]
    add(
        "personal",
        "Beyond code",
        "personal",
        "personal",
        plain_text(personal["description"])
        + "\n"
        + "\n".join(f"{link['label']}: {link['url']}" for link in personal["links"]),
        settings.site_url + "#beyond",
    )
    return documents
