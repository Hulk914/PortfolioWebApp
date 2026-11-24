"""Apply the selected backend settings without publishing or logging environment values."""

import json
import os
import shutil
import subprocess
from pathlib import Path
from urllib.parse import urlsplit


def main() -> None:
    for name in ("VERCEL_TOKEN", "VERCEL_ORG_ID", "VERCEL_PROJECT_ID"):
        if not os.environ.get(name, "").strip():
            raise RuntimeError(
                f"Configure the {name} GitHub Actions secret before deploying."
            )
    executable = shutil.which("vercel")
    if not executable:
        raise RuntimeError(
            "Install the pinned Vercel CLI before configuring deployment."
        )
    project = os.environ["VERCEL_PROJECT_ID"]
    team = os.environ["VERCEL_ORG_ID"]
    if not project.startswith("prj_") or not team.startswith("team_"):
        raise RuntimeError("Vercel project/team IDs do not have the expected format.")
    endpoint = f"/v9/projects/{project}?teamId={team}"
    result = subprocess.run(
        [
            executable,
            "api",
            endpoint,
            "--method",
            "PATCH",
            "--input",
            str(
                Path(__file__).resolve().parents[1] / "deploy" / "project-settings.json"
            ),
            "--token",
            os.environ["VERCEL_TOKEN"],
        ],
        capture_output=True,
        timeout=90,
    )
    if result.returncode:
        raise RuntimeError(
            "Could not configure the Vercel project. Check the deployment token and its team/project access; raw API output was suppressed."
        )
    configured = json.loads(result.stdout)
    if (
        configured.get("rootDirectory") != "backend"
        or configured.get("framework") != "fastapi"
    ):
        raise RuntimeError("Vercel did not apply the expected backend root/preset.")
    if (
        configured.get("ssoProtection", {}).get("deploymentType")
        != "prod_deployment_urls_and_all_previews"
    ):
        raise RuntimeError(
            "Production alias protection was not configured as expected."
        )
    host = urlsplit(os.environ["BACKEND_PRODUCTION_URL"]).hostname
    aliases = configured.get("targets", {}).get("production", {}).get("alias", [])
    if aliases and host not in aliases:
        raise RuntimeError(
            "BACKEND_PRODUCTION_URL is not a production alias of the selected Vercel project."
        )
    if environment_file := os.environ.get("GITHUB_ENV"):
        bypass = next(
            (
                secret
                for secret, metadata in configured.get("protectionBypass", {}).items()
                if metadata.get("scope") == "automation-bypass"
            ),
            None,
        )
        if not bypass or any(character.isspace() for character in bypass):
            raise RuntimeError(
                "Create a Protection Bypass for Automation secret in the Vercel project's Deployment Protection settings before deploying."
            )
        print(f"::add-mask::{bypass}")
        with Path(environment_file).open("a", encoding="utf-8") as output:
            output.write(f"VERCEL_AUTOMATION_BYPASS_SECRET={bypass}\n")
    print(
        json.dumps(
            {
                "status": "configured",
                "project": configured["name"],
                "framework": "fastapi",
                "root_directory": "backend",
                "production_url": os.environ["BACKEND_PRODUCTION_URL"],
                "production_alias_public": True,
                "preview_deployments_protected": True,
            }
        )
    )


if __name__ == "__main__":
    main()
