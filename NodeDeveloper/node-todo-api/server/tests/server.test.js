const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');

var { app } = require('../server');
var { Todo } = require('../models/todo');

const testTodos = [
    {
      _id: new ObjectID(),
      text: 'First test todo'
    },
    {
      _id: new ObjectID(),
      text: 'Second test todo'
    }
];

beforeEach((done) => {

  Todo.remove({}).then(() => {

    return Todo.insertMany(testTodos);

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

            expect(todos.length).toBe(testTodos.length + 1);
            expect(todos[todos.length-1].text).toBe(text);
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

          expect(todos.length).toBe(testTodos.length);
          done();

        }).catch((e) => done(e));

      });
  });

  describe('GET /todos', () => {

      it('should get all todos', (done) => {

          request(app)
            .get('/todos')
            .expect(200)
            .expect((res) => {

              expect(res.body.todos.length).toBe(testTodos.length);

            })
            .end((err, res) => {

                if (err) {
                  return done(err);
                }

                done();

            });

      });

  });

  describe('GET /todos/:id', () => {

    it('should return todo doc', (done) => {

        var expected = testTodos[0];

        request(app)
          .get(`/todos/${expected._id}`)
          .expect(200)
          .expect((res) => {

            expect(res.body.todo).toBeA('object');
            expect(res.body.todo.text).toBe(expected.text);

          })
          .end(done);
    });

    it('should return 404 if todo not found', (done) => {

      request(app)
        .get(`/todos/${new ObjectID()}`)
        .expect(404)
        .end(done);

    });

    it('should return 400 if todo id not valid', (done) => {

      request(app)
        .get('/todos/123')
        .expect(400)
        .end(done);

    });

  });

  describe('DELETE /todos/:id', () => {

      it('should delete existing todo', (done) => {

        var expected = testTodos[0];

        request(app)
          .delete(`/todos/${expected._id}`)
          .expect(200)
          .expect((res) => {

            expect(res.body.todo).toBeA('object');
            expect(res.body.todo.text).toBe(expected.text);

            Todo.findById(expected._id).then((todo) =>{

              expect(todo).toNotExist();

            }).catch(done);

          })
          .end(done);
      });

      it('should return 404 if todo not found', (done) => {

        request(app)
          .delete(`/todos/${new ObjectID()}`)
          .expect(404)
          .end(done);

      });

      it('should return 400 if todo id not valid', (done) => {

        request(app)
          .delete('/todos/123')
          .expect(400)
          .end(done);

      });
  });

});
