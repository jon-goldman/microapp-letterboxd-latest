name: Update Letterboxd Feed
on:
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours
  workflow_dispatch: # Allows manual trigger

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.x'

      - name: Fetch and Process RSS
        run: python update_feed.py

      - name: Commit and Push if changed
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git add feed.json
          git diff --quiet && git diff --staged --quiet || (git commit -m "Update Letterboxd feed" && git push)
