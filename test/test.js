const express = require('express');
const { after } = require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server/app');

chai.use(chaiHttp);
const expect = chai.expect;

before((done) => {
  app.listen(3000, () => {
    console.log('Serveur de test démarré sur le port 3000');
    done();
  });
});

// Arrêter le serveur après les tests
after((done) => {
  if (app && app.listening) {
    app.close(() => {
      console.log('Serveur de test arrêté');
      setTimeout(() => {
        done();
      }, 1000); // Ajoute un délai d'attente de 1 seconde (ajuste si nécessaire)
    });
  } else {
    done();
  }
});



describe('App', () => {
  it('should respond with a welcome message at the root URL', (done) => {
    chai.request(app)
      .get('/')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.equal("Bienvenue sur la page d'accueil de l'application !");
        done();
      });
  });
  it('should return a 404 status code for undefined routes', (done) => {
    chai.request(app)
      .get('/undefinedroute')
      .end((err, res) => {
        expect(res).to.have.status(404);
        done();
      });
  });

});


