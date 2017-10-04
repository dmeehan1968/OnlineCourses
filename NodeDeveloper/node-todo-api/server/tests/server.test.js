const expect = require('expect');
const request = require('supertest');

var { app } = require('../server');
var { Todo } = require('../models/todo');

const todos = [
    {
      text: 'First test todo'
    },
    {
      text: 'Second test todo'
    }
];

beforeEach((done) => {

  Todo.remove({}).then(() => {

    return Todo.insertMany(todos);

  }).then(() => done());

});

describe('POST /todos', () => {

  it('should create a new todo', (done) => {

    var text = 'test todo text';

    request(app)
      .post('/todos')
      .send({ text })
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {

        if (err) {
          return done(err);
        }

        Todo.find().then((todos) => {

            expect(todos.length).toBe(1);
            expect(todos[0].text).toBe(text);
            done();
        }).catch((e) => done(e));

      });

  });

  it('should not create todo with invalid body data', (done) => {

    request(app)
      .post('/todos')
      .send({})
      .expect(400)
      .expect((res) => {
        expect(res.body.name).toBe('ValidationError')
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find().then((todos) => {

          expect(todos.length).toBe(0);
          done();

        }).catch((e) => done(e));

      });
  });

});
