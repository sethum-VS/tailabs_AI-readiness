@AGENTS.md

## Deploy Configuration (configured by /setup-deploy)
- Platform: Vercel
- Production URL: https://tai-readiness-tool.vercel.app
- Deploy workflow: auto-deploy on push
- Deploy status command: vercel ls --prod
- Merge method: squash
- Project type: web app
- Post-deploy health check: https://tai-readiness-tool.vercel.app

### Custom deploy hooks
- Pre-merge: none
- Deploy trigger: automatic on push to main
- Deploy status: poll production URL
- Health check: https://tai-readiness-tool.vercel.app
