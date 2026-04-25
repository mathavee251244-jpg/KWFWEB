@echo off
echo [KWF] Deploying to Firebase...
npx firebase-tools@latest deploy --only hosting
echo [KWF] Done. https://webmay-251244.web.app
