# Déployer Vitour

## Frontend

Le dépôt `sebproia/vtour_vps` est relié au projet Vercel `vtour-vps`.
Un merge sur `main` publie automatiquement l’interface sur https://vtour-vps.vercel.app.

## Backend Convex

Le workflow **Deploy Convex production**, fichier `.github/workflows/deploy-convex.yml`, déploie les fonctions et le schéma sur `grateful-greyhound-940`, le déploiement configuré par `NEXT_PUBLIC_CONVEX_URL` dans Vercel.

Le secret `CONVEX_DEPLOY_KEY` est conservé dans GitHub, soit comme secret du dépôt, soit dans l’environnement GitHub `production`. Il doit s’agir d’une clé de production de ce déploiement, avec la permission `deployment:deploy`. Ne jamais copier cette clé dans le code, les logs, un commentaire ou un chat. Les agents n’ont pas besoin de lire sa valeur.

Le workflow démarre sur les modifications de `convex/**`, des dépendances ou du workflow lui-même sur `main`. Il est également relançable depuis GitHub Actions → Deploy Convex production → Run workflow, branche `main`.

Pour les agents disposant du CLI GitHub :

```bash
gh workflow run deploy-convex.yml --repo sebproia/vtour_vps --ref main
gh run list --repo sebproia/vtour_vps --workflow deploy-convex.yml --limit 5
gh run view RUN_ID --repo sebproia/vtour_vps
```

Les commandes demandent les permissions GitHub Actions appropriées. Les clés secrètes restent dans le runner GitHub et ne sont exposées qu’à l’étape de déploiement, après installation, tests et compilation. Le workflow refuse une branche différente de `main` ou une clé ne ciblant pas la production attendue. Il ne permet pas de déployer arbitrairement une branche fournie en entrée.

## Ordre de publication

Pour une évolution où le frontend dépend de nouvelles règles Convex :

1. Préparer une PR backend avec ses tests, sans activer la nouvelle interface.
2. Vérifier le diff, les tests et `npm run build`, puis fusionner cette PR sur `main`.
3. Attendre le succès du workflow **Deploy Convex production** pour le SHA fusionné. En cas d’erreur, corriger le backend ou la configuration ; ne pas publier l’interface dépendante.
4. Fusionner la PR frontend et vérifier le déploiement Vercel et le parcours concerné.

Les règles backend doivent rester compatibles avec l’interface actuellement publiée pendant cette transition. Pour une évolution incompatible, préparer un déploiement en plusieurs versions et une migration adaptée.

Une simple correction frontend sans changement Convex ne demande aucune clé Convex. Ne pas lancer de déploiement backend depuis une preview ou un événement `pull_request_target`.
