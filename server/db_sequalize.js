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
    state: DataTypes.STRING,
    lead_time: DataTypes.STRING,
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

try {
    sequelize.authenticate();
    console.log('Connection has been established successfully.');
} catch (error) {
    console.error('Unable to connect to the database:', error);
}

async function syncDataBase() {
    await sequelize.sync();
}

async function syncTask1(taskId, taskName, taskLeadTime, taskCreatedAt, taskUpdatedAt) {

    const [syncedTask] = await Task.findOrCreate(
        {
            where: { task_id: taskId, name: taskName },
        });

    console.log(syncedTask.name)

    await syncedTask.update({
        lead_time: taskLeadTime,
        createdTime: taskCreatedAt,
        updatedTime: taskUpdatedAt,
    })
}

module.exports = { syncDataBase, syncTask1 }