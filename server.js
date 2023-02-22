 const express = require('express');
 const bodyParser = require('body-parser');
 const cors = require('cors');
 const db = require('./db');
 let dbconnection = db.dbconnection;


 const port = process.env.PORT || 5000;
 let app = express();

 app.use(bodyParser.json());
 app.use(cors());

 dbconnection.connect();
 app.use(function timeLog(req, res, next) {
     next()
 })

 app.get("/test-api", (req, res) => {
     res.json({
         message: "This is rest api working....."
     });
 });


 app.post('/add-questions', async(req, res) => {
     try {
         let postData = req.body;
         let insertQuestions = "insert into mcq_questions( question,option1,option2,option3,option4,correct_option) VALUES (?,?,?,?,?,?)"
         await dbconnection.query(insertQuestions, [postData.question, postData.option1, postData.option2, postData.option3, postData.option4, postData.correct_option], function(err, rows) {
             if (err) throw err;
             res.json({ 'status': true });
         });
     } catch (e) {
         res.json({ 'status': false });
     }
 });


 app.get('/get-all--questions', async(req, res) => {
     try {
         let selectQuestions = "select question,option1,option2,option3,option4,question_id from mcq_questions";
         await dbconnection.query(selectQuestions, function(err, rowsData) {
             if (err) throw err;
             if (rowsData && rowsData.length > 0) {
                 res.json({ 'status': true, result: rowsData });
             } else {
                 res.json({ 'status': false, result: [] });
             }
         });
     } catch (e) {
         res.json({ 'status': false });
     }
 });


 app.post('/collect-user-questions', async(req, res) => {
     let PostData = req.body.PostData;
     if (PostData.forEach(x => PostData.splice(PostData.findIndex(n => n.selectedOption == null), 1)));
     let userId = req.body.userId;
     let isPresentRec = false;

     await PostData.forEach(async function(rec) {
         var selectCorrectOption = "select correct_option from mcq_questions where question_id=?";
         await dbconnection.query(selectCorrectOption, [rec.question_id], async function(err, correctOption) {
             if (err) throw err;
             var checkCorrectFlag = 0;
             await correctOption.forEach(async function(correct_opt) {
                 if (rec.selectedOption === correct_opt.correct_option) {
                     checkCorrectFlag = 1;
                 }
             });

             var selectCorrectOption = "select * from user_answers where question_id=? AND user_id=?";
             await dbconnection.query(selectCorrectOption, [rec.question_id, userId], async function(err, checkUser) {
                 if (err) throw err;
                 if (checkUser.length > 0) {
                     isPresentRec = true;
                 } else {
                     var insertAnsTable = "insert into user_answers( user_id,question_id,selected_option,is_correct_option) VALUES (?,?,?,?)";
                     await dbconnection.query(insertAnsTable, [userId, rec.question_id, rec.selectedOption, checkCorrectFlag], function(err, rows) {
                         if (err) throw err;
                     });
                 }
             });
         });
     });
     if (isPresentRec) {
         await res.json({ 'status': false, 'message': "Test already given by this user" });
     } else {
         await res.json({ 'status': true, 'message': "Test Has Been Submitted" });
     }
 });

 app.post('/user-checkin', async(req, res) => {
     try {
         let postData = req.body;
         let selectUser = "select * from user where name=? ";
         await dbconnection.query(selectUser, [postData.name, postData.email], function(err, rowsData) {
             if (err) throw err;
             if (rowsData && rowsData.length > 0) {
                 res.json({ 'status': true, result: rowsData });
             } else {
                 let insertUser = "insert into user( name,email) VALUES (?,?)";
                 dbconnection.query(insertUser, [postData.name, postData.email], function(err, rows) {
                     let user_id = rows.insertId;
                     let selectUserInner = "select * from user where user_id=?";
                     dbconnection.query(selectUserInner, [user_id], function(err, rowsDataselect) {
                         res.json({ 'status': true, result: rowsDataselect });
                     });
                 });
             }
         });
     } catch (e) {
         res.json({ 'status': false });
     }
 });



 app.post('/get-user-score-details', async(req, res) => {
     try {
         let userId = req.body.userId;
         let selectUser = "select * from user_answers where user_id=? AND selected_option IS NOT NULL;";
         await dbconnection.query(selectUser, [userId], async function(err, rowsData) {
             if (err) throw err;
             if (rowsData && rowsData.length > 0) {
                 let totalAttempt = rowsData.length;
                 let correctCount = 0;
                 let wrongCount = 0;
                 let TotalQuestions = 5;
                 await rowsData.forEach(async function(rec1) {
                     (rec1.is_correct_option === 1) ? correctCount++ : wrongCount++;

                 });
                 res.json({ status: true, totalAttempt: totalAttempt, TotalQuestions: TotalQuestions, correctCount: correctCount, wrongCount: wrongCount })
             }
         });
     } catch (e) {
         res.json({ 'status': false });
     }
 });



 app.listen(port, () => {
     console.log(`server is running on ${port}`);
 });