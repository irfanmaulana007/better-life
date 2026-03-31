# Create Pull Request

Create a pull request to main branch with a detailed description.

## Instructions

1. First, check the current branch and ensure it's not `main`:
   ```bash
   git branch --show-current
   ```

2. If on `main` branch, stop and inform the user they need to be on a feature branch.

3. Get the commits that will be included in the PR (commits since diverging from main):
   ```bash
   git log main..HEAD --oneline
   ```

4. Get the full diff to understand all changes:
   ```bash
   git diff main...HEAD
   ```

5. Analyze ALL commits and the full diff thoroughly, then generate a well-structured PR description:

   **Title Guidelines:**
   - Use conventional commit format: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`
   - Be specific and concise (max 72 characters)
   - Example: `feat: Add API debug logging with environment toggle`

   **Summary Section:**
   - Write 2-4 bullet points capturing the HIGH-LEVEL purpose of the PR
   - Focus on WHAT was achieved and WHY, not implementation details
   - Each bullet should be a complete, standalone statement
   - Start with action verbs (Add, Implement, Fix, Update, Remove, Refactor)

   **Changes Section:**
   - Group changes by file or logical area
   - Use format: `**\`path/to/file.ts\`**: Description of what changed`
   - Be specific about what was added, modified, or removed
   - Mention new functions, components, or configurations by name
   - Include relevant technical details (new dependencies, API changes, etc.)
   - For large PRs, organize under subheadings (e.g., "### Backend", "### Frontend")

   **Test Plan Section:**
   - Provide step-by-step instructions to verify the changes work
   - Use checkbox format for actionable test steps
   - Include setup steps if needed (env vars, dependencies, etc.)
   - Cover both happy path and edge cases where relevant
   - For bug fixes, describe how to verify the bug is fixed

   **Optional Sections (include when relevant):**
   - **Breaking Changes**: List any breaking changes prominently at the top
   - **Screenshots**: For UI changes, mention screenshots should be added
   - **Related Issues**: Reference related issues with `Fixes #123` or `Related to #456`

6. Show the user the generated PR title and description.

7. If there are uncommitted changes, commit them first:
   ```bash
   git add -A
   git commit -m "<conventional commit message>"
   ```

8. Push the branch and create the PR:
   ```bash
   git push -u origin <branch-name>
   gh pr create --title "<title>" --body "<body>"
   ```

9. Return the PR URL to the user.

## PR Description Template

```markdown
## Summary
- [High-level description of what this PR achieves]
- [Another key change or improvement]
- [Why this change was needed - the motivation]

## Changes
- **`path/to/file1.ts`**: [Specific description of changes in this file]
- **`path/to/file2.tsx`**: [What was added/modified/removed]
- **`path/to/config.json`**: [Configuration changes]

## Test Plan
- [ ] [Setup step if needed, e.g., "Set `ENV_VAR=value` in `.env`"]
- [ ] [First verification step]
- [ ] [Second verification step]
- [ ] [Edge case or error scenario to test]

---
Generated with [Claude Code](https://claude.ai/code)
```

## Notes
- Always target `main` branch
- Review ALL commits, not just the latest one - the PR description should reflect the entire changeset
- Be specific with file paths and function/component names
- Mention any breaking changes prominently at the TOP of the description
- For UI changes, suggest adding screenshots
- Keep descriptions scannable - use formatting (bold, code blocks) effectively
