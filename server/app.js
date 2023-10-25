const express = require('express')
const cron = require('node-cron');
const axios = require('axios');
const { graphqlHTTP } = require('express-graphql');
const bodyParser = require('body-parser');
const { graphql, buildSchema } = require('graphql');

require('dotenv').config({ path: '../.env' })

const app = express()
const port = 3000

const schema = buildSchema(`
    type Query {
        hello: String
    }
`);

const root = {
  hello: () => {
    return 'Hello world!';
  },
};

const { Client } = require('pg')

const client = new Client({
  user: 'postgres',
  password: 'postgres',
  host: "localhost",
  port: 5432,
  database: "postgres"
})

client.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

app.use(bodyParser.json());

app.use('/graphql', graphqlHTTP({
  schema,
  rootValue: root,
  graphiql: true
}));

//Tableau de stockage des messages de console.log
const logMessages = [];

//VARIABLES METRIQUES
let differenceInDays = 0;
let differenceInSeconds = 0;
const dateActuelle = new Date();

const baseUrl = "https://api.github.com/graphql";

const headers = {
  "Content-Type": "application/json",
  authorization: "bearer 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" //CHANGER TOKEN
};

//requete metriques
const query1 = {
  query: ` query {
    node(id: "PVT_kwHOAWcErM4AVdZf") {
      ... on ProjectV2 {
        items(first: 20) {
          nodes{
            fieldValues(first:8) {
              nodes{
                ... on ProjectV2ItemFieldTextValue {
                  text
                    }                            
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  createdAt
                  updatedAt
                }
              }
            }
          }
        }
      }
    }
  }
  `,
};

const queryPullRequest = {
  query: ` query {
repository(owner: "Horion31", name: "log680-grp1-eq20-e23") {
  name
  owner {
    login
  }
  description
  createdAt
  updatedAt
  stargazerCount
  forkCount
  watchers {
    totalCount
  }
  issues {
    totalCount
  }
  pullRequests(first: 5) {
    totalCount
    nodes {
      number
      title
      createdAt
      updatedAt
      closedAt
      author {
        login
      }
      body
      state
      comments {
        totalCount
      }
    }
  }
}
}

  `,
};


//routes

//Metrique 1 : Lead Time pour une tâche donnée
app.get('/kanban/metrique1/:nomTache', async (req, res) => {
  try {
    const nomTache = req.params.nomTache;
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(query1)
    });

    const data = await response.json();

    let i = 0;
    while (i < data.data.node.items.nodes.length) {
      const node = data.data.node.items.nodes[i];
      if (node.fieldValues.nodes[3].text === nomTache) {
        if (node.fieldValues.nodes[4].name === "Terminé") {
          const createdAt = new Date(node.fieldValues.nodes[4].createdAt);
          const updatedAt = new Date(node.fieldValues.nodes[4].updatedAt);
          const differenceInMilliseconds = updatedAt - createdAt;
          differenceInSeconds = differenceInMilliseconds / 1000;
          differenceInDays = Math.round(differenceInSeconds / (60 * 60 * 24));
          break
        }

        else {
          const createdAt = new Date(node.fieldValues.nodes[4].createdAt);
          const differenceInMilliseconds = dateActuelle - createdAt;
          differenceInSeconds = differenceInMilliseconds / 1000;
          differenceInDays = Math.round(differenceInSeconds / (60 * 60 * 24));
          break
        }

      }

      i++;
    }

    //console.log(`Le leadtime pour la tache donnée "${nomTache}" est de ${differenceInSeconds} secondes, soit ${differenceInDays} jours.`);
    //res.json(data);

    logMessages.pop();
    logMessages.push(`Le leadtime pour la tache donnée "${nomTache}" est de ${differenceInSeconds} secondes, soit ${differenceInDays} jours.`);

    const logHtml = `<ul>${logMessages.map(message => `<li>${message}</li>`).join('')}</ul>`;

    const pageHtml = `
      <html>
        <head>
          <title>Métrique 1 - Projet Kaban :  Lead Time pour une tâche donnée</title>
        </head>
        <body>
          <h1>Métrique 1 - Projet Kaban :  Lead Time pour une tâche donnée</h1>
          ${logHtml}
        </body>
      </html>
`;
    res.send(pageHtml);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des données du tableau Kanban.' });
  }

});

//Métrique 2 : Lead time pour les tâches terminées dans une période donnée
app.get('/kanban/metrique2/:dateDebut/:dateFin', async (req, res) => {
  try {
    const dateDebut = new Date(req.params.dateDebut);
    const dateFin = new Date(req.params.dateFin);
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(query1),
    });

    const data = await response.json();

    //console.log(`Pour la periode de ${dateDebut} à ${dateFin} \n`);
    logMessages.pop();
    //logMessages.push(`Pour la periode de ${dateDebut} à ${dateFin} : \n\n`);


    let i = 0;
    while (i < data.data.node.items.nodes.length) {
      const node = data.data.node.items.nodes[i];
      const dateCompletion = new Date(node.fieldValues.nodes[4].updatedAt);
      if ((node.fieldValues.nodes[4].name === "Terminé") && (dateDebut <= dateCompletion) && (dateFin >= dateCompletion)) {
        const createdAt = new Date(node.fieldValues.nodes[4].createdAt);
        const updatedAt = new Date(node.fieldValues.nodes[4].updatedAt);
        const differenceInMilliseconds = updatedAt - createdAt;
        differenceInSeconds = differenceInMilliseconds / 1000;
        differenceInDays = Math.round(differenceInSeconds / (60 * 60 * 24));
        logMessages.push(`Le Lead time pour la tache ${node.fieldValues.nodes[3].text} : ${differenceInSeconds} secondes, soit ${differenceInDays} jours`);
        //logHtml = `<ul>${logMessages.map(message => `<li>${message}</li>`).join('')}</ul>`;
        //console.log(`Le Lead time pour la tache ${node.fieldValues.nodes[3].text} : ${differenceInSeconds} secondes, soit ${differenceInDays} jours`);

      }
      i++;
    }
    const logHtml = `<ul>${logMessages.map(message => `<li>${message}</li>`).join('')}</ul>`;

    const pageHtml = `
      <html>
        <head>
          <title>Métrique 2 - Projet Kaban : Lead time pour les tâches terminées dans une période donnée</title>
        </head>
        <body>
          <h1>Métrique 2 - Projet Kaban : Lead time pour les tâches terminées dans une période donnée</h1>
          ${logHtml}
        </body>
      </html>
    `;
    res.send(pageHtml);

    let j = 0;
    while (j < data.data.node.items.nodes.length) {
      logMessages.pop();
      j++;
    }

    //res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des données du tableau Kanban.' });
  }
});



//Métrique 3 : Nombre de tâches actives pour une colonne donnée
app.get('/kanban/metrique3/:NomColonne', async (req, res) => {
  try {
    const NomColonne = req.params.NomColonne;
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(query1),
    });

    let compteurTachesColonne = 0;
    const data = await response.json();
    let i = 0;
    while (i < data.data.node.items.nodes.length) {
      const node = data.data.node.items.nodes[i];
      if (node.fieldValues.nodes[4].name === NomColonne) {
        compteurTachesColonne++;
      }
      i++;
    }

    logMessages.pop();
    logMessages.push(`Le nombre de tâches dans la colonne "${NomColonne}" est : ${compteurTachesColonne}`);

    const logHtml = `<ul>${logMessages.map(message => `<li>${message}</li>`).join('')}</ul>`;

    const pageHtml = `
      <html>
        <head>
          <title>Métrique 3 - Projet Kaban : Nombre de tâches actives pour une colonne donnée</title>
        </head>
        <body>
          <h1>Métrique 3 - Projet Kaban : Nombre de tâches actives pour une colonne donnée</h1>
          ${logHtml}
        </body>
      </html>



    `;
    res.send(pageHtml);

    //console.log(`Le nombre de tâches dans la colonne "${NomColonne}" est : ${compteurTachesColonne}`);
    //res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des données du tableau Kanban.' });
  }
});


//Métrique 4 : nombre de tâches complétées pour une période donnée
app.get('/kanban/metrique4/:dateDebut/:dateFin', async (req, res) => {
  try {
    const dateDebut = new Date(req.params.dateDebut);
    const dateFin = new Date(req.params.dateFin);
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(query1),
    });

    const data = await response.json();
    let compteurTachesFinies = 0;
    let i = 0;

    while (i < data.data.node.items.nodes.length) {
      const node = data.data.node.items.nodes[i];
      const dateCompletion = new Date(node.fieldValues.nodes[4].updatedAt);
      if ((node.fieldValues.nodes[4].name === "Terminé") && (dateDebut <= dateCompletion) && (dateFin >= dateCompletion)) {
        compteurTachesFinies++;
      }
      i++;
    }

    logMessages.pop();
    logMessages.push(`Le nombre de tâches terminées pour la periode de ${dateDebut} à ${dateFin} est : ${compteurTachesFinies}`);

    const logHtml = `<ul>${logMessages.map(message => `<li>${message}</li>`).join('')}</ul>`;

    const pageHtml = `
      <html>
        <head>
          <title>Métrique 4 - Projet Kaban : Nombre de tâches complétées pour une période donnée</title>
        </head>
        <body>
          <h1>Métrique 4 - Projet Kaban : Nombre de tâches complétées pour une période donnée</h1>
          ${logHtml}
        </body>
      </html>
    `;
    res.send(pageHtml);

    //console.log(`Le nombre de tâches terminées pour la periode de ${dateDebut} à ${dateFin} est : ${compteurTachesFinies}`);
    //res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des données du tableau Kanban.' });
  }
});

//routes Pull Request
//metrique1 : temps de réaction après le lancement de la pull request
app.get('/pullrequest/metrique1', async (req, res) => {
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(queryPullRequest),
    });

    const data = await response.json();
    let i = 0;

    while (i < data.data.repository.pullRequests.nodes.length) {
      const pullRequest = data.data.repository.pullRequests.nodes[i];
      const createdAt = new Date(pullRequest.createdAt);
      const updatedAt = new Date(pullRequest.updatedAt);
      const timeDiff = (updatedAt - createdAt) / 1000;

      logMessages.pop();
      logMessages.push(`Le temps entre le lancement de la pull-request appelée "${pullRequest.title}"  et sa dernière update est de ${timeDiff} secondes.`);

      //console.log(`La pull-request appelée "${pullRequest.title}" a été révisée la première fois au bout de ${timeDiff} secondes.`);

      i++;
    }

    const logHtml = `<ul>${logMessages.map(message => `<li>${message}</li>`).join('')}</ul>`;
    //res.json(data);
    const pageHtml = `
      <html>
        <head>
          <title>Métrique 1 - Pull Request Temps de réaction après le lancement de la pull request</title>
        </head>
        <body>
          <h1>Métrique 1 - Pull Request Temps de réaction après le lancement de la pull request</h1>
          ${logHtml}
        </body>
      </html>
    `;
    res.send(pageHtml);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des données du tableau Kanban.' });
  }
});


//metrique2 : temps de fusion des pull request
app.get('/pullrequest/metrique2', async (req, res) => {
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(queryPullRequest),
    });

    const data = await response.json();
    let i = 0;

    while (i < data.data.repository.pullRequests.nodes.length) {
      const pullRequest = data.data.repository.pullRequests.nodes[i];
      const createdAt = new Date(pullRequest.createdAt);
      const closedAt = new Date(pullRequest.closedAt);
      if (pullRequest.closedAt === null) {
        const timeDiff = (dateActuelle - createdAt) / 1000;

        logMessages.pop();
        logMessages.push(`Le temps de fusion pour la pull request appelée "${pullRequest.title}" est : ${timeDiff} secondes`);

        //console.log(`Le temps de fusion pour la pull request appelée "${pullRequest.title}" est : ${timeDiff} secondes `);
      }
      else {
        const timeDiff2 = (closedAt - createdAt) / 1000;
        logMessages.pop();
        logMessages.push(`Le temps de fusion pour la pull request appelée "${pullRequest.title}" est : ${timeDiff2} secondes`);
        //console.log(`le temps de fusion pour la pull request appelée "${pullRequest.title}" est : ${timeDiff2} secondes `);
      }

      i++;
    }

    const logHtml = `<ul>${logMessages.map(message => `<li>${message}</li>`).join('')}</ul>`;
    //res.json(data);
    const pageHtml = `
      <html>
        <head>
          <title>Métrique 2 - Pull Request Temps de fusion</title>
        </head>
        <body>
          <h1>Métrique 2 - Pull Request Temps de fusion</h1>
          ${logHtml}
        </body>
      </html>
    `;
    res.send(pageHtml);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des données du tableau Kanban.' });
  }
});


//metrique3 : nombre de pull requests actives pour une période donnée
app.get('/pullrequest/metrique3', async (req, res) => {
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(queryPullRequest),
    });

    const data = await response.json();

    let compteurPR = 0;
    let i = 0;

    while (i < data.data.repository.pullRequests.nodes.length) {
      const pullRequest = data.data.repository.pullRequests.nodes[i];
      const createdAt = new Date(pullRequest.createdAt);
      const closedAt = new Date(pullRequest.closedAt);
      if ((createdAt <= dateFin) && ((closedAt >= dateFin) || (pullRequest.closedAt == null))) {
        compteurPR++;
      }
      i++;
    }
    //console.log(`Le nombre de pull request actives pour la periode de ${dateDebut} à ${dateFin} est : ${compteurPR}`);
    logMessages.pop();
    logMessages.push(`Le nombre de pull request actives pour la periode de ${dateDebut} à ${dateFin} est : ${compteurPR}`);
    const logHtml = `<ul>${logMessages.map(message => `<li>${message}</li>`).join('')}</ul>`;
    const pageHtml = `
    <html>
      <head>
        <title>Métrique 3 - Pull Request Acitves pour une période donnée</title>
      </head>
      <body>
        <h1>Métrique 3 - Pull Request Acitves pour une période donnée</h1>
        ${logHtml}
      </body>
    </html>
  `;

    res.send(pageHtml);

    //res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des données du tableau Kanban.' });
  }
});

//metrique4 : nombre de commentaires pour les pull requests pour une période donnée
app.get('/pullrequest/metrique4', async (req, res) => {
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(queryPullRequest),
    });

    const data = await response.json();

    let compteurPR = 0;
    let i = 0;

    while (i < data.data.repository.pullRequests.nodes.length) {
      const pullRequest = data.data.repository.pullRequests.nodes[i];
      const createdAt = new Date(pullRequest.createdAt);
      const closedAt = new Date(pullRequest.closedAt);
      if ((createdAt <= dateFin) && ((closedAt >= dateFin) || (pullRequest.closedAt == null))) {
        logMessages.pop();
        logMessages.push(`Le nombre de commentaires pour la pull request appelée "${pullRequest.title}" pour la période de ${dateDebut} à ${dateFin} est : "${pullRequest.comments.totalCount}"`);

        //console.log(`Le nombre de commentaires pour la pull request appelée "${pullRequest.title}" pour la periode de ${dateDebut} à ${dateFin} est : "${pullRequest.comments.totalCount}"`);
      }
      i++;
    }

    const logHtml = `<ul>${logMessages.map(message => `<li>${message}</li>`).join('')}</ul>`;
    //res.json(data);
    const pageHtml = `
      <html>
        <head>
          <title>Métrique 4 - Pull Request Commentaires</title>
        </head>
        <body>
          <h1>Métrique 4 - Pull Request Commentaires</h1>
          ${logHtml}
        </body>
      </html>
    `;
    res.send(pageHtml);
    //logMessages = [];
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des données du tableau Kanban.' });
  }
});

//metrique5 : taux de succès des pull request (pourcentage de pull reuqests qui sont fusionnées par rapport au nombre total de pull requests ouvertes)
app.get('/pullrequest/metrique5', async (req, res) => {
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(queryPullRequest),
    });

    const data = await response.json();

    let compteurOpen = 1;
    let compteurMerged = 0;
    let i = 0;

    while (i < data.data.repository.pullRequests.nodes.length) {
      const pullRequest = data.data.repository.pullRequests.nodes[i];
      if (pullRequest.state === "OPEN") {
        compteurOpen++;
      }
      else if (pullRequest.state === "MERGED") {
        compteurMerged++;
      }
      else { }
      i++;
    }
    const taux = (compteurMerged / compteurOpen) * 100;

    //console.log(`Le taux de succès des pull request est de : "${taux}%"`);
    //res.json(data);
    logMessages.pop();
    logMessages.push(`Le taux de succès des pull request est de : "${taux}%"`);
    const logHtml = `<ul>${logMessages.map(message => `<li>${message}</li>`).join('')}</ul>`;
    const pageHtml = `
      <html>
        <head>
          <title>Métrique 5 - Pull Request Taux de succès</title>
        </head>
        <body>
          <h1>Métrique 5 - Pull Request Taux de succès</h1>
          ${logHtml}
        </body>
      </html>
    `;

    res.send(pageHtml);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des données du tableau Kanban.' });
  }
});



//metrique visualisation
app.get('/snapshot', async (req, res) => {
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(query1),

    });

    const data = await response.json();

    const kanbanData = {
      columns: [
        {
          title: 'Backlog',
          tasks: []
        },
        {
          title: 'A faire',
          tasks: []
        },
        {
          title: 'En cours',
          tasks: []
        },

        {
          title: 'Revue',
          tasks: []
        },

        {
          title: 'Bloqué',
          tasks: []
        },

        {
          title: 'Terminé',
          tasks: []
        }
      ]
    };

    let i = 0;
    let j = 0;

    while (i < data.data.node.items.nodes.length) {
      const node = data.data.node.items.nodes[i];
      if (node.fieldValues.nodes[4].name === "Backlog") {
        kanbanData.columns[0].tasks.push(node.fieldValues.nodes[3].text);
      }
      else if (node.fieldValues.nodes[4].name === "A faire") {
        kanbanData.columns[1].tasks.push(node.fieldValues.nodes[3].text);
      }

      else if (node.fieldValues.nodes[4].name === "En cours") {
        kanbanData.columns[2].tasks.push(node.fieldValues.nodes[3].text);
      }

      else if (node.fieldValues.nodes[4].name === "Revue") {
        kanbanData.columns[3].tasks.push(node.fieldValues.nodes[3].text);
      }

      else if (node.fieldValues.nodes[4].name === "Bloqué") {
        kanbanData.columns[4].tasks.push(node.fieldValues.nodes[3].text);
      }

      else if (node.fieldValues.nodes[4].name === "Terminé") {
        kanbanData.columns[5].tasks.push(node.fieldValues.nodes[3].text);
      }

      i++;
    }
    const kanbanHtml = generateKanbanHtml(kanbanData);

    res.send(kanbanHtml);

    //res.json(data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des données du tableau Kanban.' });
  }
});



function generateKanbanHtml(kanbanData) {
  let html = '<html><head><title>Kanban Snapshot</title></head><body>';
  html += '<div class="kanban-board">';
  html += '<div class="row">';

  kanbanData.columns.forEach(column => {
    html += '<div class="column">';
    html += `<h2>${column.title} (${column.tasks.length} tâches)</h2>`; // Affiche le nombre de tâches
    html += '<ul>';

    column.tasks.forEach(task => {
      html += `<li class="task">${task}</li>`;
    });

    html += '</ul>';
    html += '</div>';
  });

  html += '</div>';
  html += '</div></body></html>';

  return html;
}


app.get("/", (req, res) => {
  res.send("Bienvenue sur la page d'accueil de l'application !");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
