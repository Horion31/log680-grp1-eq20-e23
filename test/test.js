const express = require('express');
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server/app');

chai.use(chaiHttp);
const expect = chai.expect;
/*
before((done) => {
  app.listen(3000, () => {
    console.log('Serveur de test démarré sur le port 3000');
    done();
  });
});*/

after((done) => {
  app.close((err) => {
    if (err) {
      console.error('Erreur lors de l\'arrêt du serveur de test:', err);
    } else {
      console.log('Serveur de test arrêté');
    }
    done();
  });
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


