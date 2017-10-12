require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');

var { mongoose } = require('./db/mongoose');
var { Todo } = require('./models/todo');
var { User } = require('./models/user');
var { authenticate } = require('./middleware/authenticate');

var app = express();
var port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/todos', authenticate, async (req, res) => {

  try {

    var todo = new Todo({
      text: req.body.text,
      _creator: req.user._id
    });

    const doc = await todo.save();
    res.send(doc);

  } catch(e) {

    res.status(400).send(e);

  }

});

app.get('/todos', authenticate, async (req, res) => {

  try {

    const todos = await Todo.find({ _creator: req.user._id });
    res.send({ todos });

  } catch(e) {

    res.status(400).send(e);

  }

});

app.get('/todos/:id', authenticate, async (req, res) => {

  var id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send();
  }

  try {

      const todo = await Todo.findOne({
          _id: id,
          _creator: req.user._id
        });

      if (!todo) {
        return res.status(404).send();
      }

      res.status(200).send({ todo });

  } catch(e) {

    res.status(404).send();

  }

});

app.delete('/todos/:id', authenticate, async (req, res) => {

  try {

    var id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send();
    }

    const todo = await Todo.findOneAndRemove({
        _id: id,
        _creator: req.user._id
      });

    if (!todo) {
      return res.status(404).send();
    }

    res.status(200).send({ todo });

  } catch(e) {

    res.status(404).send();

  }

});

app.patch('/todos/:id', authenticate, (req, res) => {

  var id = req.params.id;
  var body = _.pick(req.body, [ 'text', 'completed' ]);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send();
  }

  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  Todo.findOneAndUpdate({
    _id: id,
    _creator: req.user._id
  }, {
    $set: body
  },
  { new: true }).then((todo) => {

    if (!todo) {
      return res.status(404).send();
    }

    res.send({ todo });

  }).catch((e) => res.status(404).send());

});

app.post('/users', async (req, res) => {

  try {

    var body = _.pick(req.body, [ 'email', 'password' ]);
    var user = new User(body);

    await user.save();
    const token = await user.generateAuthToken();
    res.header('x-auth', token).send(user);

  } catch(e) {

    res.status(400).send(e);

  }

});

app.get('/users/me', authenticate, (req, res) => {

    res.send(req.user);

});

app.delete('/users/me/token', authenticate, async (req, res) => {

  try {

    await req.user.removeToken(req.token);
    res.status(200).send();

  } catch(e) {

    res.status(400).send();

  }

});

app.post('/users/login', async (req, res) => {

  try {

    var body = _.pick(req.body, [ 'email', 'password' ]);
    var user = await User.findByCredentials(body.email, body.password);
    var token = await user.generateAuthToken();

    res.set('x-auth', token).send(user);

  } catch(e) {

    res.status(400).send();

  }

});

app.listen(port, () => {

  console.log(`Started on ${port}`);

});

module.exports = {
  app
};
