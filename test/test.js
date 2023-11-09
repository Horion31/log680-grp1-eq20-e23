/*const express = require('express');
const mocha = require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server/app.js');

chai.use(chaiHttp);
const expect = chai.expect;

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
*/
