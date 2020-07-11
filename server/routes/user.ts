import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import {
  createUser, addUserToParty, getUser, updateUser, getAllUsers,
} from '../db/methods';

const userRouter = express.Router();

// send the id token to google to double check that it's real
userRouter.post('/verify', (req, res) => {
  // console.log(req.body, 'beginning of userRoute');
  const { id_token, userObj } = req.body;
  const client = new OAuth2Client(process.env.REACT_APP_GOOGLE_CLIENT_ID);
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const googleId = payload.sub;
    // this will return a googleId
    return googleId;
  }
  verify()
    .then((googleId) => {
      // we want to query our database instead of sending this id
      // if the id matches someone in our database, send back that user
      // if it does not, create that user in the database and send backthat user
      return getUser(googleId);
    })
    .then((userData:any) => {
      // console.log(userData, 'after getUser*****************');
      // if the user is in our database
      if (userData) {
        // console.log(userData, 'if(userArray)******************');
        res.send(userData);
      } else {
        // user is not in database, so let's add the user
        const {
          Au, Bd, JU, MK, nU, nW,
        } = userObj.Qt;
        const user = {
          nameFirst: nW,
          nameLast: nU,
          username: Bd,
          email: Au,
          avatar: MK,
          googleId: JU,
        };
        // console.log(user, 'user not found ************');
        createUser(user);
        res.send(user);
      }
    })
    .catch(console.error);
});

userRouter.put('/profile/edit', (req, res) => {
  console.log(req.body);
  const { userObj } = req.body;
  updateUser(userObj)
    .then((data) => {
      console.log(data);
      res.send('changed user data');
    })
    .catch((error) => console.log(error));
});

userRouter.post('/:userId/joins/:partyId', (req, res) => {
  const { userId, partyId } = req.params;
  // console.log(req.params, '/userid/joins/partyid')
  addUserToParty(userId, partyId)
    .then(() => {
      res.send('user added to party');
    })
    .catch((err) => console.error(err));
});

// dummy route to add users via postman
userRouter.post('/add', (req, res) => {
  const user = req.body;
  createUser(user);
  res.send(user);
});

// Get all user from db
userRouter.get('/all', (req, res) => {
  getAllUsers()
    .then((users) => {
      res.send(users);
    })
    .catch(error => console.log(error));
});

export default userRouter;