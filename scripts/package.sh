#!/usr/bin/env bash
set -euo pipefail

# Drupal Contrib Skills Packaging & Validation Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

VERSION="${1:-1.0.0}"
TARBALL_NAME="drupal-contrib-skills-v${VERSION}.tar.gz"

echo "=================================================="
echo " Drupal Contrib Skills Validator & Packager"
echo " Target Version: ${VERSION}"
echo "=================================================="

# 1. Validate SKILL.md files
echo "[1/3] Validating skill definitions..."
SKILL_COUNT=0
for skill_dir in "${REPO_ROOT}"/skills/*; do
  if [ -d "${skill_dir}" ]; then
    skill_name="$(basename "${skill_dir}")"
    skill_file="${skill_dir}/SKILL.md"

    if [ ! -f "${skill_file}" ]; then
      echo "  ERROR: Missing SKILL.md in ${skill_dir}"
      exit 1
    fi

    # Check for name and description in frontmatter
    if ! grep -q "^name:" "${skill_file}"; then
      echo "  ERROR: ${skill_name}/SKILL.md missing 'name:' frontmatter"
      exit 1
    fi

    if ! grep -q "^description:" "${skill_file}"; then
      echo "  ERROR: ${skill_name}/SKILL.md missing 'description:' frontmatter"
      exit 1
    fi

    SKILL_COUNT=$((SKILL_COUNT + 1))
    echo "  ✓ Validated skill: ${skill_name}"
  fi
done
echo "Total verified skills: ${SKILL_COUNT}"

# 2. Validate marketplace.json
echo "[2/3] Validating marketplace catalog..."
if [ -f "${REPO_ROOT}/.claude-plugin/marketplace.json" ]; then
  # Basic json check using python
  python3 -c "import json; json.load(open('${REPO_ROOT}/.claude-plugin/marketplace.json'))"
  echo "  ✓ .claude-plugin/marketplace.json is valid JSON"
else
  echo "  ERROR: Missing .claude-plugin/marketplace.json"
  exit 1
fi

# 3. Create Distribution Tarball
echo "[3/3] Creating distribution tarball: ${TARBALL_NAME}..."
cd "${REPO_ROOT}"
tar -czf "${TARBALL_NAME}" \
  skills/ \
  docs/ \
  .claude-plugin/ \
  composer.json \
  README.md \
  LICENSE

echo "=================================================="
echo " SUCCESS! Tarball created at: ${REPO_ROOT}/${TARBALL_NAME}"
echo " File size: $(du -h "${TARBALL_NAME}" | cut -f1)"
echo "=================================================="
