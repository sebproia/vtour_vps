# Guide de Référence pour les Agents Applicatifs (AGENTS.md)

Ce document sert de source de vérité pour toutes les CLIs et agents IA (Antigravity, Claude Code, Codex, etc.) contribuant à ce projet. Lisez-le attentivement avant toute modification.

---

## 1. Description du Projet
**Vitour** (nom du package: `food-tour-app`) est une application web permettant de créer des parcours culinaires (Food Tours), d'y ajouter des étapes de dégustation, de récolter des notes et commentaires de convives en direct, et de générer un récapitulatif visuel sous forme de "Story" partageable.

---

## 2. Stack Technique
* **Frontend** : Next.js 16.2 (App Router, Turbopack)
* **Backend & BDD** : Convex 1.34+ (Real-time queries, Mutations, File Storage, HTTP Actions)
* **Authentification** : Clerk (Intégré avec Convex via JWT, thémé via `@clerk/ui` et shadcn)
* **Cartographie** : Google Maps API (`@react-google-maps/api`)
* **Styles & Animations** : Tailwind CSS v4, Lucide React, Framer Motion, Base UI, tw-animate-css

---

## 3. Structure des Dossiers Principaux
* `convex/` : Code du backend Convex (exécuté sur le cloud Convex).
  * `schema.ts` : Définition des tables et index de la base de données.
  * `auth.config.ts` : Configuration de la validation JWT pour Clerk.
  * `tours.ts`, `places.ts`, `ratings.ts`, `photos.ts` : API endpoints (requêtes, mutations).
* `src/app/` : Pages et routage Next.js.
  * `sign-in/`, `sign-up/` : Pages d'authentification personnalisées.
  * `tour/[id]/` : Écran d'administration/gestion d'un tour (création d'étapes, statut en direct).
  * `recap/[id]/` : Écran de récapitulatif du tour (avis, statistiques, exportation).
  * `join/[id]/` : Écran d'avis pour les invités participant au tour.
  * `ConvexClientProvider.tsx` : Fournisseur client branché sur Clerk.
* `src/components/` : Composants UI réutilisables.

---

## 4. Schéma Convex (`convex/schema.ts`)
* **`tours`** : Un parcours culinaire.
  * `name` (string), `status` ("draft" | "live" | "completed"), `currentStepIndex` (number), `organizerId` (string - Clerk ID), `date` (optionnel), `isPublic` (boolean optionnel).
* **`places`** : Une étape de dégustation dans un tour.
  * `tourId` (ID tours), `name` (string), `address` (string), `order` (number), `description` (optionnel), `coordinates` ({lat: number, lng: number} optionnel), `adminComment` (optionnel), `openingHours` (optionnel), `googlePlaceId` (optionnel).
  * Index : `by_tour` sur `tourId`.
* **`ratings`** : Une note de dégustation attribuée par un invité.
  * `placeId` (ID places), `guestName` (string), `score` (number 1-10 optionnel), `emojiRating` (string optionnel), `comment` (string optionnel).
  * Index : `by_place` sur `placeId`.
* **`photos`** : Une photo de plat téléchargée par un invité ou l'organisateur.
  * `placeId` (ID places), `storageId` (ID de fichier Convex `_storage`), `uploaderName` (string).
  * Index : `by_place` sur `placeId`.

---

## 5. Règles de Développement et Patterns Critiques

### 🚫 Pas d'imbrication HTML invalide (Erreurs d'hydratation React)
Ne jamais entourer un élément complet contenant des boutons, liens ou entrées interactives dans un tag `<Link>` de Next.js ou une balise `<a>`.
* **Pattern d'overlay obligatoire pour les cartes** : Si une carte entière (Card) doit être cliquable mais contient des boutons d'actions (ex: modifier, supprimer) :
  1. Utilisez une balise `div` ou `<Card className="relative">` pour la carte.
  2. Mettez le lien de navigation principale uniquement sur le **titre** de la carte en ajoutant la classe `"after:absolute after:inset-0 after:z-10"`. Cela étend virtuellement la zone de clic à toute la carte sans gêner le DOM.
  3. Donnez à la zone des boutons d'actions la classe `"relative z-20"` et ajoutez `e.stopPropagation()` sur leurs gestionnaires de clics pour isoler les clics.
  4. Appliquez `pointer-events-none` sur les badges décoratifs positionnés de manière absolue pour que les clics passent à travers vers l'overlay.

### 🔒 Sécurité et Authentification
* Dans le backend Convex, vérifiez toujours l'identité de l'utilisateur via `ctx.auth.getUserIdentity()`. N'accordez l'accès ou la modification d'un tour qu'à son `organizerId` correspondant (sauf si le tour est public ou s'il s'agit d'un invité soumettant une note sur un tour actif).
* L'URL du fournisseur Clerk dans `convex/auth.config.ts` est fixée sur l'instance active du projet : `https://ethical-pheasant-58.clerk.accounts.dev`.

---

## 6. Commandes Utiles
* **Développement local Next.js** : `npm run dev`
* **Développement Convex (Live Sync)** : `npx convex dev`
* **Vérification de compilation locale** : `npm run build`
* **Déploiement Backend en Production** : `npx convex deploy`
* **Git Status / Commits** : À faire après chaque tâche aboutie.

---

## 7. Pipeline de Déploiement
1. Le code source est hébergé sur GitHub : `git@github.com:sebproia/vtour_vps.git`.
2. Le push sur la branche `main` déclenche automatiquement un build et déploiement de production sur **Vercel**.
3. Avant tout push, assurez-vous que `npm run build` passe avec succès en local et que le backend Convex de production est à jour (`npx convex deploy`).
