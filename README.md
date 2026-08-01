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
- **Le Cercle** — vos correspondants. Consultez la Gazette, apposez des réactions au tampon rouge (« Félicitations », « Courage », « Splendide », « Quelle santé »).
- **Le Télégramme** — quand vous consignez un événement, avisez tout le Cercle par télégramme (« FAIT ACCOMPLI STOP »). Vous pouvez aussi adresser un télégramme individuel à un correspondant, depuis le trône.
- **Statistiques** — total, note moyenne, lieux distincts, série de jours consécutifs, répartition Bristol.
- **Décorations** — huit distinctions à conquérir, de « Première pierre » à « Bristol complet ».
- **Export** — le registre s'exporte en JSON. Les archives peuvent aussi être brûlées.

## Vie privée

Cacou n'expédie aucune donnée. Tout demeure dans le `localStorage` de votre navigateur, comme il se doit. (Seule exception : une requête facultative à Nominatim/OpenStreetMap pour deviner le nom du lieu.)

## Pile technique

HTML, CSS et JavaScript sans framework. [Leaflet](https://leafletjs.com) pour la carte, tuiles OpenStreetMap, typographies EB Garamond et Courier Prime.
