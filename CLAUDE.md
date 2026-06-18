# Directives de Développement (CLAUDE.md)

Ce fichier indique aux agents IA (comme Claude Code) comment compiler, tester et formater ce projet. Pour l'architecture globale, le schéma de base de données et les règles de style, consultez impérativement [AGENTS.md](file:///workspace/projects/vtour_vps/AGENTS.md).

## Commandes Importantes

* **Lancement du serveur de dev Next.js** : `npm run dev`
* **Lancement du compilateur Convex dev** : `npx convex dev`
* **Validation / Build local** : `npm run build`
* **Linter** : `npm run lint`
* **Déploiement production Convex** : `npx convex deploy`

## Directives pour les modifications Convex
Ce projet utilise [Convex](https://convex.dev) comme backend.
* **Consultez toujours `convex/_generated/ai/guidelines.md`** avant d'éditer le dossier `convex/`.
* N'hésitez pas à installer de nouveaux outils Convex à l'aide de `npx convex ai-files install`.
