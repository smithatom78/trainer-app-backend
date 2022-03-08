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
//view trainer
app.get('/api/viewprofile/:email', async (req, res) => {

    const _email = req.params.email;
    const filter = { email: _email };
    let doc1 = await TrainerInfo.findOne(filter)
    console.log("trainer", doc1);

    //UserInfo.findOneAndUpdate(filter, {type:type, approved:'true'}, { new: true })
    //  .then(function(users){
    res.json(doc1);
    //});

});
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
                    utype: "trainer"
                })
                let result = user.save((err, data) => {
                    if (err) {
                        res.status(201).send({ status: 'error happened' })
                    }
                    else {
                        res.send({ status: 'sucesss' })
                    }
                })
            }
            else {
                res.status(201).send({ status: 'email id already exists' })
            }
        })
    }
    catch (error) {
        res.status(201).send({ status: 'error' })
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
        var utype = req.body.utype
        //for approve check
        let result = UserLoginInfo.find({ email: userEmail }, (err, data) => {
            if (data.length > 0) {
                try {
                    const passwordValidator = bcrpt.compareSync(userPass, data[0].password)
                    console.log(passwordValidator)
                    if (passwordValidator) {
                        // token generation
                        jwt.sign({ email: data[0].email, id: data[0]._id },
                            'godblessu',
                            { expiresIn: '1d' },
                            (err, token) => {
                                if (err) {
                                    res.status(201).send({ status: 'error in token generation' })
                                }
                                else {
                                    let pwCheckFlag = false;
                                    if (utype == "trainer") {
                                        let approve = TrainerInfo.find({ email: userEmail }, (err, data1) => {
                                            if (data1.length > 0) {
                                                pwCheckFlag = data1[0].approved;
                                                console.log("appr", pwCheckFlag)
                                                if (pwCheckFlag) {
                                                    res.send({ status: 'login success', token: token })
                                                    return;
                                                }else{
                                                    res.status(201).send({ status: 'unauthorised' })
                                                    return
                                                }
                                            }
                                        })
                                    } else {
                                        res.send({ status: 'login success', token: token })
                                        return;
                                    }
                                }
                            }
                        )
                    }
                    else {
                        res.status(201).send({ status: 'invalid password' })
                    }
                }
                catch (error) {
                    res.json({ status: 'error..failed' })
                }
            }
            else {
                res.status(201).send({ status: 'invalid email id' })
            }
        })


        //end approve check
    }
    catch (error) {
        res.json({ status: 'error..authentication failed' })

    }
})

//listening to port

//app.listen(process.env.PORT || 5000, () => { console.log(`Listening on port ${process.env.PORT} or 5000`) });
//listening to port

app.listen(5000, () => { console.log("listening on port 5000") });
