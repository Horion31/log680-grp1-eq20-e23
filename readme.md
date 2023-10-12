# Documentation Laboratoire 1

## API : récupération des métriques

### Lancement de l'API

__Avant tout, il faut remplacer le token du fichier, dans la variable *headers* du début du fichier par un token ayant toutes les autorisations d'accès au repertoire et son contenu.__  
Il sera alors possible d'exécuter le fichier __app.js__ dans le dossier *log680-grp1-eq20-e23/server* après s'être assuré d'avoir installé les packages express, express-graphql, node-fetch.

` > node app.js `

Les réponses pour les différentes URL entrées seront affichées sous le format html sur la page, par soucis de facilité de lecture. Le framework Expressjs a été utilisé.

<br>
<br>

### Métriques Kanban

Voici les métriques liées à un projet Kanban qui on été implémentées : 
1. __Métrique 1 : Temps (lead time) pour une tâche donnée.__  
   Si la tâche est terminée, le lead time s’obtient par la différence entre la date d’update dans la colonne terminée (car la tâche est supposée finie quand elle arrive dans cette colonne) et la date de création de cette tâche.  
   Si la tâche est encore en cours, le lead time est obtenu par la différence entre la date actuelle et la date de création de la tâche. 
   Le nom de la tâche spécifique *nomTache* est récupéré dans l'URL entré.  
   
3. __Métrique 2 : Temps (lead time) pour les tâches terminées dans une période donnée.__  
   Cette métrique reprend le même principe que la métrique précédente. En plus, elle vérifie que la date de création et de fermeture de la tâche est bien comprise dans la période récupérée dans la requête. 
   
4. __Métrique 3 : Nombre de tâches actives pour une colonne donnée.__  
   Ce nombre s’obtient à l’aide d’un compteur qui s’incrémente à chaque correspondance entre le nom de la colonne récupéré choisi et les informations du tableau Kanban. Cette métrique est importante pour identifier une contrainte et contrôler le nombre de tâches. Cela permet par la suite de limiter le nombre de travaux en cours.

5. __Métrique 4 : Nombre de tâches complétés pour une période donnée.__  
   Ce nombre d’obtient également au moyen d’un compteur qui s’incrémente lorsque le nom de la colonne qui contient la tâche correspond à la colonne “Terminé”. Cette métrique est une première étape à la limitation des travaux en cours, car cela indique que l'équipe a plus tendance à commencer de nouvelles tâches qu'à finir celles qui sont déjà commencées.
<br>      

Les routes associées à ces métriques sont :  
1. __https://localhost:3000/kanban/metrique1/:nomTache__ : remplacer *nomTache*.
2. __https://localhost:3000/kanban/metrique2/:dateDebut/:dateFin__ : remplacer *dateDebut* et *dateFin*.
3. __https://localhost:3000/kanban/metrique3/:NomColonne__ : remplacer *nomColonne*.
4. __https://localhost:3000/kanban/metrique4/:dateDebut/:dateFin__ : remplacer *nomColonne*.  

<br>
<br>

### Métriques pull requests

Les métriques pull requests choisies sont les suivantes:
1. __Métrique 1 : Temps entre le lancement de la pull-request et sa dernière update.__  
Cette métrique a été choisie pour mettre en évidence la perte de temps entre le lancement de la pull-request et la dernière fois qu’elle a été revue. Cela se calcule simplement en prenant la différence entre la date de création de la pull request et la date de son update. 

2. __Métrique 2 : Temps de fusion des pull requests.__  
Cette métrique a été choisie pour montrer l’équivalent du lead time pour une tâche, mais qui est ici appliqué à la pull request. Cela met en avant le temps requis pour une pull request pour être fermée. Ce temps se calcule en prenant la différence entre l’ouverture et la fermeture de la pull request. Ceci est un indicateur significatif pour aider à l'estimation les délais de déploiement de code.

3. __Métrique 3 : Nombre de pull requests actives pour une période donnée.__  
Cette métrique a été choisie car elle est très importante en DevOps. Cette mesure reflète la fréquence d'intégration de code au sein de l'équipe, ce qui est essentiel pour la mise en place d'un processus de déploiement continu. Elle indique la dynamique de travail de l'équipe de développement et de son engagement envers une livraison continue et de qualité.

4. __Métrique 4 : Nombre de commentaires pour les pull requests pour une période donnée.__  
Cette métrique permet d’évaluer l'efficacité des pull requests. Elle permet de mettre en évidence les défis en termes d'efficacité, de qualité du travail et de communication au sein de l'équipe. Un nombre élevé de commentaires peut indiquer des lacunes dans la transmission d'informations, ce qui peut avoir un impact négatif sur l'efficacité globale du processus. 

5. __Métrique 5 : Taux de succès des pull requests (pourcentage de pull requests qui sont fusionnées par rapport au nombre total de pull requests ouvertes).__  
Cette métrique a été choisie pour montrer le taux de réussite des demandes de fusion. Elle s’obtient en prenant le quotient du nombre de pull request fusionnées sur le nom de pull requests ouvertes, le tout multiplié par 100. Ce taux est similaire au %C/A (pourcentage complet et exact) qui représente la qualité du travail.
<br>

Les routes associées à ces métriques sont :  
1. __https://localhost:3000/pullrequest/metrique1__ 
2. __https://localhost:3000/pullrequest/metrique2__
3. __https://localhost:3000/pullrequest/metrique3__
4. __https://localhost:3000/pullrequest/metrique4__
5. __https://localhost:3000/pullrequest/metrique5__  

<br>
<br>

### Métrique de Visualisation

Cette métrique affiche les différentes tâches présentent dans chaque colonne (aini que leur nombre) à l'instant actuel. La route associée est : __https://localhost:3000/snapshot__
