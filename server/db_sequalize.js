const { Sequelize, DataTypes, Model } = require('sequelize')

const sequelize = new Sequelize({
    host: 'localhost',
    database: 'db_postgres',
    username: 'postgres',
    password: 'postgres',
    port: 5432,
    dialect: 'postgres'
});

class Task extends Model { }

Task.init({
    task_id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    state: DataTypes.ENUM('Backlog', 'A faire', 'Bloqué', 'En cours', 'Revue', 'Terminé'),
    lead_time_second: DataTypes.STRING,
    lead_time_day: DataTypes.STRING,
    createdTime: DataTypes.DATE,
    updatedTime: DataTypes.DATE
}, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'Task' // We need to choose the model name
});

class Project extends Model { }

Project.init({
    project_id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    name: DataTypes.STRING,
    createdTime: DataTypes.STRING
}, {
    sequelize, // We need to pass the connection instance
    modelName: 'Project' // We need to choose the model name
});

class PullRequest extends Model { }

PullRequest.init({
    pull_request_id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    title: DataTypes.STRING,
    createdTime: DataTypes.DATE,
    updatedTime: DataTypes.DATE,
    reaction_time: DataTypes.DOUBLE,
    fusion_time: DataTypes.DOUBLE
}, {
    sequelize, // We need to pass the connection instance
    modelName: 'Pull Request' // We need to choose the model name
});

try {
    sequelize.authenticate();
    console.log('Connection has been established successfully.');
} catch (error) {
    console.error('Unable to connect to the database:', error);
}

async function syncDataBase() {
    await sequelize.sync();
}

async function syncTaskLeadTime(taskId, taskName, taskLeadTime, taskCreatedAt, taskUpdatedAt) {

    const [syncedTask] = await Task.findOrCreate(
        {
            where: { task_id: taskId, name: taskName },
        });

    console.log(syncedTask.name)

    await syncedTask.update({
        lead_time_second: taskLeadTime,
        lead_time_day: Math.round(taskLeadTime / (60 * 60 * 24)),
        createdTime: taskCreatedAt,
        updatedTime: taskUpdatedAt,
    })
}

async function syncTaskRaw(taskId, taskName, taskLeadTimeSec, taskLeadTimeDay, taskCreatedAt, taskUpdatedAt, taskState) {

    const [syncedTask] = await Task.findOrCreate(
        {
            where: { task_id: taskId, name: taskName },
        });

    console.log(syncedTask.name)

    await syncedTask.update({
        lead_time_second: taskLeadTimeSec,
        lead_time_day: taskLeadTimeDay,
        createdTime: taskCreatedAt,
        updatedTime: taskUpdatedAt,
        state: taskState
    })
}

async function syncTaskWithState(taskId, taskName, taskState) {

    const [syncedTask] = await Task.findOrCreate(
        {
            where: { task_id: taskId, name: taskName },
        });

    await syncedTask.update({
        state: taskState
    })
}

async function syncPullRequest1(pullRequestId, pullRequestTitle, pullRequestCreatedTime, pullRequestUpdatedTime, pullRequestReactionTimeSec) {

    const [syncedPullRequest] = await PullRequest.findOrCreate(
        {
            where: { pull_request_id: pullRequestId },
        });

    await syncedPullRequest.update({
        title: pullRequestTitle,
        createdTime: pullRequestCreatedTime,
        updatedTime: pullRequestUpdatedTime,
        reaction_time: pullRequestReactionTimeSec
    })
}

async function syncPullRequest2(pullRequestId, pullRequestTitle, pullRequestCreatedTime, pullRequestUpdatedTime, pullRequestFusionTimeSec) {

    const [syncedPullRequest] = await PullRequest.findOrCreate(
        {
            where: { pull_request_id: pullRequestId },
        });

    await syncedPullRequest.update({
        title: pullRequestTitle,
        createdTime: pullRequestCreatedTime,
        updatedTime: pullRequestUpdatedTime,
        fusion_time: pullRequestFusionTimeSec
    })
}

module.exports = { syncDataBase, syncTaskLeadTime, syncTaskRaw, syncTaskWithState, syncPullRequest1, syncPullRequest2 }