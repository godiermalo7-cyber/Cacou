# Cacou

**Registre cartographique des commissions** — fondé en MMXXVI.

Cacou est une application web d'une dignité absolue, consacrée à un sujet qui ne l'est pas : consigner sur une carte tous les endroits où vous avez fait caca, avec la rigueur d'un notaire et l'esthétique d'un vieux carnet de terrain.

## Lancer l'application

Aucune installation, aucun build. Servez simplement le dossier :

```bash
python3 -m http.server 8000
# puis ouvrez http://localhost:8000
```

(Ou ouvrez `index.html` directement — un serveur local est toutefois recommandé pour la géolocalisation.)

## Fonctionnalités

- **La Carte** — cliquez pour situer l'événement, chaque pastille sépia est un souvenir. Fond de carte OpenStreetMap patiné façon vieille gravure.
- **Le Procès-verbal** — chaque événement est consigné avec :
  - l'**échelle de Bristol** (types I à VII, classification médicale authentique) ;
  - une **appréciation générale** (une à cinq étoiles) ;
  - la **durée de la séance** (de « Éclair » à « Sabbatique — téléphone déchargé ») ;
  - le **contexte** (domicile, travail, pleine nature…) ;
  - l'**empreinte sonore** (du « Silence monacal » au « Sismique ») ;
  - les **observations du greffier** en texte libre.
- **Le Journal** — relevé chronologique numéroté, tenu comme un registre d'état civil.
- **Le Cercle, avec de vrais amis** — chacun possède une **carte de visite** (QR code + lien). Faites-la scanner ou envoyez le lien : la personne devient un « correspondant certifié ». Aucun serveur, aucun compte : la connexion se fait par échange de codes.
- **Le Télégramme, pour de vrai** — quand vous consignez un événement, un télégramme (« FAIT ACCOMPLI STOP ») est rédigé et vous pouvez le **transmettre par WhatsApp, SMS ou tout autre canal** via le bouton Transmettre. Quand votre ami ouvre le lien, le télégramme s'imprime dans sa Gazette et vous êtes automatiquement ajouté à ses correspondants. Idem pour le « poke » individuel, envoyé depuis le trône.
- **La Gazette** — dépêches des correspondants (réels et d'honneur), réactions au tampon rouge (« Félicitations », « Courage », « Splendide », « Quelle santé »).
- **L'Édition de nuit** — bascule ☾ dans la navigation : le registre s'éclaire à la lampe à huile, carte comprise.
- **Statistiques** — total, note moyenne, lieux distincts, série de jours consécutifs, répartition Bristol, assiduité hebdomadaire.
- **Hors ligne** — un service worker (stratégie « réseau d'abord ») rend l'app consultable sans connexion, tout en garantissant les mises à jour dès qu'on est en ligne.
- **Décorations** — huit distinctions à conquérir, de « Première pierre » à « Bristol complet ».
- **Export** — le registre s'exporte en JSON. Les archives peuvent aussi être brûlées.

## Vie privée

Cacou n'expédie aucune donnée. Tout demeure dans le `localStorage` de votre navigateur, comme il se doit. (Seule exception : une requête facultative à Nominatim/OpenStreetMap pour deviner le nom du lieu.)

## Pile technique

HTML, CSS et JavaScript sans framework. [Leaflet](https://leafletjs.com) pour la carte, tuiles OpenStreetMap, [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) pour les cartes de visite, typographies EB Garamond et Courier Prime. Les deux bibliothèques sont vendorisées dans `vendor/`.
