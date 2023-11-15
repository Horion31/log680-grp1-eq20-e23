// #region import 
const express = require('express')
const cron = require('node-cron');
const axios = require('axios');
const fetch = require('node-fetch-commonjs');
const { graphqlHTTP } = require('express-graphql');
const bodyParser = require('body-parser');
const { graphql, buildSchema } = require('graphql');
const { graphqlImport } = require('graphql-import-node/register');
const { importSchema } = require('graphql-import');
const { makeExecutableSchema } = require('@graphql-tools/schema')
const expressGraphQl = require("express-graphql");
const db_util = require('./db_sequalize')
const { readFileSync } = require('fs')
// #endregion

require('dotenv').config()

const app = express()
const port = 3000


db_util.syncDataBase();

// const { query } = require("./schemas/queries");
const { GraphQLSchema } = require("graphql");
const schema = new GraphQLSchema({
});

const typeDefs = readFileSync(require.resolve('./schemas/schema.docs.graphql'), { encoding: 'utf-8' });

const executableSchema = makeExecutableSchema({
  typeDefs
})

app.use(bodyParser.json());

app.use('/graphql', graphqlHTTP({
  schema: executableSchema,
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
  authorization: `bearer ${process.env.GITHUB_TOKEN}`
};

//requete metriques
//nodeID LAB1 : PVT_kwHOAWcErM4AVdZf
const query1 = (nodeID) => {
  return {
    query: ` query {
    node(id: "${nodeID}") {
      ... on ProjectV2 {
        items(first: 20) {
          nodes{
            fieldValues(first:8) {
              nodes{
                ... on ProjectV2ItemFieldTextValue {
                  text
                    }                            
                ... on ProjectV2ItemFieldSingleSelectValue {
                  id
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
      id
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

//Requête CI
//ID noeaud pour le workflow CI CD pour le lab2 : W_kwDOKf4pOM4Eea0K
const queryCI = (nodeID_CI) => {
  return {
    query: ` query {
    node(id: "${nodeID_CI}") {
      ... on Workflow {
        runs(first: 100) {
          nodes {
            runNumber
            createdAt
            updatedAt
            checkSuite {
              status
              conclusion
            }
          }
        }
      }
    }
  }

  `,
  };
};

//routes

//Metrique 1 : Lead Time pour une tâche donnée
app.get('/kanban/metrique1/:nodeID/:nomTache', async (req, res) => {
  let task_id;
  let createdAt;
  let updatedAt;
  try {
    const nomTache = req.params.nomTache;
    const nodeID = req.params.nodeID; //ID du noeuds (projet)
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(query1(nodeID))
    });

    const data = await response.json();

    console.log(process.env.GITHUB_TOKEN)

    let i = 0;
    while (i < data.data.node.items.nodes.length) {
      const node = data.data.node.items.nodes[i];
      if (node.fieldValues.nodes[3].text === nomTache) {

        task_id = node.fieldValues.nodes[4].id
        createdAt = node.fieldValues.nodes[4].createdAt
        updatedAt = node.fieldValues.nodes[4].updatedAt

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
    db_util.syncTaskLeadTime(task_id, nomTache, differenceInSeconds.toString(), createdAt, updatedAt)

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
app.get('/kanban/metrique2/:nodeID/:dateDebut/:dateFin', async (req, res) => {
  try {
    const dateDebut = new Date(req.params.dateDebut);
    const dateFin = new Date(req.params.dateFin);
    const nodeID = req.params.nodeID; //ID du noeuds (projet)
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(query1(nodeID)),
    });

    const data = await response.json();

    logMessages.pop();


    let i = 0;
    while (i < data.data.node.items.nodes.length) {
      let task_id;
      let task_name;
      const node = data.data.node.items.nodes[i];
      const dateCompletion = new Date(node.fieldValues.nodes[4].updatedAt);
      if ((node.fieldValues.nodes[4].name === "Terminé") && (dateDebut <= dateCompletion) && (dateFin >= dateCompletion)) {
        const createdAt = new Date(node.fieldValues.nodes[4].createdAt);
        const updatedAt = new Date(node.fieldValues.nodes[4].updatedAt);
        const differenceInMilliseconds = updatedAt - createdAt;
        differenceInSeconds = differenceInMilliseconds / 1000;
        differenceInDays = Math.round(differenceInSeconds / (60 * 60 * 24));
        logMessages.push(`Le Lead time pour la tache ${node.fieldValues.nodes[3].text} : ${differenceInSeconds} secondes, soit ${differenceInDays} jours`);

        task_id = node.fieldValues.nodes[4].id
        task_name = node.fieldValues.nodes[3].text

        db_util.syncTaskRaw(task_id, task_name, differenceInSeconds, differenceInDays, createdAt, updatedAt, "Terminé")
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
app.get('/kanban/metrique3/:nodeID/:NomColonne', async (req, res) => {
  try {
    let task_id;
    let task_name;
    const NomColonne = req.params.NomColonne;
    const nodeID = req.params.nodeID; //ID du noeuds (projet)
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(query1(nodeID)),
    });

    let compteurTachesColonne = 0;
    const data = await response.json();
    let i = 0;
    while (i < data.data.node.items.nodes.length) {
      const node = data.data.node.items.nodes[i];
      if (node.fieldValues.nodes[4].name === NomColonne) {
        compteurTachesColonne++;
        task_id = node.fieldValues.nodes[4].id
        task_name = node.fieldValues.nodes[3].text
        db_util.syncTaskWithState(task_id, task_name, NomColonne)
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
app.get('/kanban/metrique4/:nodeID/:dateDebut/:dateFin', async (req, res) => {
  try {
    let task_id;
    let task_name;
    const dateDebut = new Date(req.params.dateDebut);
    const dateFin = new Date(req.params.dateFin);
    const nodeID = req.params.nodeID; //ID du noeuds (projet)
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(query1(nodeID)),
    });

    const data = await response.json();
    let compteurTachesFinies = 0;
    let i = 0;

    while (i < data.data.node.items.nodes.length) {
      const node = data.data.node.items.nodes[i];
      const dateCompletion = new Date(node.fieldValues.nodes[4].updatedAt);
      if ((node.fieldValues.nodes[4].name === "Terminé") && (dateDebut <= dateCompletion) && (dateFin >= dateCompletion)) {
        compteurTachesFinies++;
        task_id = node.fieldValues.nodes[4].id
        task_name = node.fieldValues.nodes[3].text
        db_util.syncTaskWithState(task_id, task_name, "Terminé")
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

      db_util.syncPullRequest1(pullRequest.id, pullRequest.title, createdAt, updatedAt, timeDiff);

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
        db_util.syncPullRequest2(pullRequest.id, pullRequest.title, createdAt, closedAt, timeDiff);
      }
      else {
        const timeDiff2 = (closedAt - createdAt) / 1000;
        logMessages.pop();
        logMessages.push(`Le temps de fusion pour la pull request appelée "${pullRequest.title}" est : ${timeDiff2} secondes`);

        db_util.syncPullRequest2(pullRequest.id, pullRequest.title, createdAt, closedAt, timeDiff2);
      }
      i++;
    }

    const logHtml = `<ul>${logMessages.map(message => `<li>${message}</li>`).join('')}</ul>`;

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
app.get('/pullrequest/metrique3/:dateDebut/:dateFin', async (req, res) => {
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(queryPullRequest),
    });

    const dateDebut = new Date(req.params.dateDebut);
    const dateFin = new Date(req.params.dateFin);

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
app.get('/pullrequest/metrique4/:dateDebut/:dateFin', async (req, res) => {
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(queryPullRequest),
    });
    const dateDebut = new Date(req.params.dateDebut);
    const dateFin = new Date(req.params.dateFin);

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
app.get('/snapshot/:nodeID', async (req, res) => {
  try {
    const nodeID = req.params.nodeID; //ID du noeuds (projet)     
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(query1(nodeID)),

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
      const taskName = node.fieldValues.nodes[3].text
      const taskState = node.fieldValues.nodes[4].name
      const task_id = node.fieldValues.nodes[4].id

      if (task_id != undefined && taskName != undefined) {

        if (taskState === "Backlog") {
          kanbanData.columns[0].tasks.push(taskName);
        }
        else if (taskState === "A faire") {
          kanbanData.columns[1].tasks.push(taskName);
        }

        else if (taskState === "En cours") {
          kanbanData.columns[2].tasks.push(taskName);
        }

        else if (taskState === "Revue") {
          kanbanData.columns[3].tasks.push(taskName);
        }

        else if (taskState === "Bloqué") {
          kanbanData.columns[4].tasks.push(taskName);
        }

        else if (taskState === "Terminé") {
          kanbanData.columns[5].tasks.push(taskName);
        }
        db_util.syncTaskWithState(task_id, taskName, taskState)
      }
      i++;
    }
    const kanbanHtml = generateKanbanHtml(kanbanData);

    res.send(kanbanHtml);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des données du tableau Kanban.' });
  }
});

//Metriques CI
//Metrique 1 CI : temps d'exécution du pipeline de build pour un build donné
app.get('/ci/metrique1/:nodeID_CI/:numBuild', async (req, res) => {
  try {
    const numBuild = parseInt(req.params.numBuild, 10);
    const nodeID_CI = req.params.nodeID_CI; //ID du noeuds (projet)     
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(queryCI(nodeID_CI))
    });

    const data = await response.json();

    let i = 0;
    while (i < data.data.node.runs.nodes.length) {
      const node = data.data.node.runs.nodes[i];
      if (node.runNumber === numBuild) {
        const createdAt = new Date(node.createdAt);
        const updatedAt = new Date(node.updatedAt);
        const differenceInMilliseconds = updatedAt - createdAt;
        differenceInSeconds = differenceInMilliseconds / 1000;
        differenceInDays = Math.round(differenceInSeconds / (60 * 60 * 24));
        db_util.syncBuildTime(numBuild, nodeID_CI, createdAt, updatedAt, differenceInSeconds)
        break

      }

      i++;
    }

    //console.log(`Le temps d'exécution du pipeline de build pour le build de numéro : "${numBuild}" est de ${differenceInSeconds} secondes, soit ${differenceInDays} jours.`);

    logMessages.pop();
    logMessages.push(`Le temps d'exécution du pipeline de build pour le build de numéro : "${numBuild}" est de ${differenceInSeconds} secondes, soit ${differenceInDays} jours.`);

    const logHtml = `<ul>${logMessages.map(message => `<li>${message}</li>`).join('')}</ul>`;

    const pageHtml = `
    <html>
      <head>
        <title>Métrique 1 - CI CD :  Temps d'exécution pour un build donné (pour les 100 derniers builds)</title>
      </head>
      <body>
        <h1>Métrique 1 - CI CD : Temps d'exécution pour un build donné</h1>
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


//Metrique 2 CI : quantité de builds
app.get('/ci/metrique2/:nodeID_CI', async (req, res) => {
  try {
    const nodeID_CI = req.params.nodeID_CI; //ID du noeuds (projet)     
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(queryCI(nodeID_CI))
    });

    const data = await response.json();

    const build_count = data.data.node.runs.nodes.length
    logMessages.pop();
    logMessages.push(`La quantité de builds pour le workflow CI CD est : "${build_count}". `);

    db_util.syncProjectBuildCount(nodeID_CI, build_count)

    const logHtml = `<ul>${logMessages.map(message => `<li>${message}</li>`).join('')}</ul>`;

    const pageHtml = `
    <html>
      <head>
        <title>Métrique 2 - CI CD : Quantité de builds</title>
      </head>
      <body>
        <h1>Métrique 2 - CI CD : Quantité de builds</h1>
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


//Metrique 3 CI : temps moyen pour l’ensemble des builds pour une période donnée
app.get('/ci/metrique3/:nodeID_CI/:dateDebut/:dateFin', async (req, res) => {
  try {
    const dateDebut = new Date(req.params.dateDebut);
    const dateFin = new Date(req.params.dateFin);
    const nodeID_CI = req.params.nodeID_CI; //ID du noeuds (projet)     
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(queryCI(nodeID_CI))
    });

    const data = await response.json();
    let TempsTotalMillisecondes = 0;
    let TempsMoyenMillisecondes = 0;
    let TempsMoyenSecondes = 0;
    let i = 0;
    while (i < data.data.node.runs.nodes.length) {
      const node = data.data.node.runs.nodes[i];
      const createdAt = new Date(node.createdAt);
      const updatedAt = new Date(node.updatedAt);
      TempsTotalMillisecondes += updatedAt - createdAt;
      db_util.syncBuildTime(node.runNumber, nodeID_CI, createdAt, updatedAt, TempsTotalMillisecondes / 1000)
      i++;
    }
    TempsMoyenMillisecondes = TempsTotalMillisecondes / (data.data.node.runs.nodes.length);
    TempsMoyenSecondes = TempsMoyenMillisecondes / 1000;

    db_util.syncProjectBuildTime(nodeID_CI, TempsMoyenSecondes)


    logMessages.pop();
    logMessages.push(`Le Temps moyen pour l’ensemble des builds pour la période donnée : ${TempsMoyenSecondes} secondes. `);

    const logHtml = `<ul>${logMessages.map(message => `<li>${message}</li>`).join('')}</ul>`;

    const pageHtml = `
    <html>
      <head>
        <title>Métrique 3 - CI CD : Temps moyen pour l’ensemble des builds pour une période donnée</title>
      </head>
      <body>
        <h1>Métrique 3 - CI CD : Temps moyen pour l’ensemble des builds pour une période donnée</h1>
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


//Metrique 4 CI : Taux de builds réussis sur les builds échoués
app.get('/ci/metrique4/:nodeID_CI', async (req, res) => {
  try {
    const nodeID_CI = req.params.nodeID_CI; //ID du noeuds (projet)     
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(queryCI(nodeID_CI))
    });

    const data = await response.json();
    let compteurSuccess = 0;
    let compteurFailure = 0;
    let i = 0;
    while (i < data.data.node.runs.nodes.length) {
      const node = data.data.node.runs.nodes[i];
      if (node.checkSuite.status === "COMPLETED" && node.checkSuite.conclusion === "SUCCESS") {
        compteurSuccess++;
        db_util.syncBuildState(node.runNumber, nodeID_CI, true)
      }

      else if (node.checkSuite.status === "COMPLETED" && node.checkSuite.conclusion === "FAILURE") {
        compteurFailure++;
        db_util.syncBuildState(node.runNumber, nodeID_CI, false)
      }
      else {
        db_util.syncBuildState(node.runNumber, nodeID_CI, false)
      }

      i++;
    }

    const taux = (compteurSuccess / compteurFailure);



    logMessages.pop();
    logMessages.push(`Le Taux de builds réussis sur les builds échoués est de : ${taux}. `);

    const logHtml = `<ul>${logMessages.map(message => `<li>${message}</li>`).join('')}</ul>`;

    const pageHtml = `
    <html>
      <head>
        <title>Métrique 4 - CI CD : Taux de builds réussis sur les builds échoués</title>
      </head>
      <body>
        <h1>Métrique 4 - CI CD : Taux de builds réussis sur les builds échoués</h1>
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

module.exports = app;
