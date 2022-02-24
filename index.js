const express = require('express');
const cors = require('cors');
const UserLoginInfo = require('./src/model/TrainerDB');
const TrainerInfo = require('./src/model/TrainerInfo');
const CounterInfo = require('./src/model/CounterDB');
//object init
const app = express();
app.use(cors());
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const jwt = require('jsonwebtoken');
const bcrpt = require('bcrypt');
app.get('/', function (req, res) {
    res.send("trainer server up");
});
/*app.post('/', function (req, res) {
    res.send(`hi ${req.body.name} trainerpost`);
});*/
//add trainer
app.post('/api/enroll', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
     const newId = await getNextSequence();
    console.log("newId", newId);
    let val = req.body;
    val.id = newId;
    console.log("val", val);

    const trainer = new TrainerInfo(val);
    const newtrainer = await trainer.save();
    console.log('newtrainer', newtrainer);

    updateSequence(newId);

    res.send({ newtrainer });

});

async function getNextSequence() {
    const filter = { type: "user" };
    let doc = await CounterInfo.findOne(filter)
    console.log("doc", doc);
    return doc.seq + 1;
}

function updateSequence(newId) {
    const filter = { type: "user" };
    CounterInfo.updateOne(filter, { seq: newId }, (err, data) => {
        if (err) {
            return err;
        }

        return data;
    })
}

//routing register
app.post("/api/register", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
    res.setHeader('Access-Control-Allow-Credentials', true)
    try {
        UserLoginInfo.find({ email: req.body.email }, (err, data) => {
            console.log("data", data);
            if (data.length == 0) {

                let user = new UserLoginInfo({
                    email: req.body.email,
                    password: bcrpt.hashSync(req.body.password, 10),
                    utype: req.body.utype
                })
                let result = user.save((err, data) => {
                    if (err) {
                        res.json({ status: 'error happened' })
                    }
                    else {
                        res.json({ status: 'sucesss' })
                    }
                })
            }
            else {
                res.json({ status: 'email id already exists' })
            }
        })
    }
    catch (error) {
        res.json({ status: 'error' })
    }
})

//login
//login authentication routing
app.post('/api/userlogin', async (req, res) => {

    try {
        if (req.body.email == undefined || req.body.password == undefined || req.body.utype == undefined) {
            res.status(500).send({ error: "authentication failed" });
        }
        console.log(req.body)
        var userEmail = req.body.email
        var userPass = req.body.password
        var utype=req.body.utype
        let result = UserLoginInfo.find({ email: userEmail }, (err, data) => {
            if (data.length > 0) {
                const passwordValidator = bcrpt.compareSync(userPass, data[0].password)
                console.log(passwordValidator)
                if (passwordValidator) {
                    // token generation
                    jwt.sign({ email: data[0].email, id: data[0]._id },
                        'godblessu',
                        { expiresIn: '1d' },
                        (err, token) => {
                            if (err) {
                                res.json({ status: 'error in token generation' })
                            }
                            else {
                                res.json({ status: 'login success', token: token })
                                req.session.loggedin = true;

                            }
                        }

                    )


                    /////////


                }
                else {
                    res.json({ status: 'invalid password' })

                }

            }
            else {
                res.json({ status: 'invalid email id' })

            }
        })




    }
    catch (error) {
        res.json({ status: 'error' })

    }

})

//listening to port

//app.listen(process.env.PORT || 5000, () => { console.log(`Listening on port ${process.env.PORT} or 5000`) });
//listening to port

app.listen(5000, () => { console.log("listening on port 5000") });
