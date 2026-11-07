# Invitations et PWA

Une URL HTTPS d’invitation reste accessible dans un navigateur pour les personnes qui n’ont pas installé Vitour. Le site ne peut pas imposer son ouverture dans une PWA installée sur tous les systèmes.

Le manifeste définit explicitement l’identité et le scope `/` de l’app, ainsi que `launch_handler.client_mode: navigate-existing`. Sur les navigateurs qui capturent déjà les liens pour la PWA, la cible de l’invitation est ainsi ouverte dans une fenêtre existante. Ce champ ne force pas la capture des liens par le système. Les raccourcis du manifeste donnent également accès au scanner et aux récaps sur les plateformes compatibles.

- Android : vérifier les réglages d’ouverture des liens compatibles de l’app, et utiliser le navigateur qui a installé la PWA. Les navigateurs intégrés à des messageries peuvent conserver les liens dans leur propre fenêtre.
- iPhone/iPad : une PWA web seule ne peut pas forcer tous les liens Safari ou de messagerie à ouvrir l’icône installée. Des Universal Links natifs nécessitent une application native associée ; le manifeste web ne remplace pas ce mécanisme.
- Sur ordinateur, la capture dépend du navigateur et du choix de l’utilisateur.

## Parcours de secours livré

Les pages d’invitation et de récap proposent « Tu as déjà la PWA Vitour ? » hors mode installé. L’utilisateur copie le lien, ouvre Vitour depuis son icône et le colle dans le scanner. Le lien reste une URL interne validée par le scanner ; aucun schéma propriétaire ni redirection automatique hasardeuse n’est utilisé.

L’app mémorise aussi le dernier tour consulté **dans son propre stockage**, et propose de le reprendre depuis son accueil. Les stockages du navigateur et de la PWA peuvent être séparés, notamment sur iOS : cette mémoire ne synchronise pas magiquement les deux contextes. Le copier/coller du lien ou le scan d’un QR reste alors nécessaire.

Le service worker est enregistré même si l’événement `load` est déjà passé au moment de l’hydratation.
