/*The machines route. Has func to register, delete, list, make default and show machine*/
//Requiring modules
var express = require('express');
var connection = require('../connection');
var router = express.Router();
// var MySqlEvents = require('mysql-events')

// var MySqlEventWatcher = MySqlEvents(connection)

router.post('/registermachine', (req,res)=>{        //Route to add a new machine with the corresponding organisation,factory and shopfloor
    console.log(req.body);
    var userdata = JSON.parse(req.cookies.userdata);        //For oid
    var fid = parseInt(req.body.factoryid);
    var sid = parseInt(req.body.shopfloorid);
    var oid = userdata.oid;
    var values = [fid,sid,oid,req.body.macid,0];            //Push values for neat insertion
        connection.query('INSERT INTO machines (fid, sid, oid, macid, defaultmac) VALUES ?',[[values]], (err,response)=>{
            if (err){
                console.log(err.sqlMessage);
                res.send(err.sqlMessage);                   //If err alert err
            }else{
                res.send('Machine sucessfully added');      //If successfull alert with this message
            }
        });
});

router.get('/listmachines', (req,res)=>{                    //To list all machines in a given shopfloor
    // console.log(JSON.parse(req.cookies.userdata));
    console.log(JSON.stringify(req.query));
    
    shopdetails=JSON.parse(JSON.stringify(req.query));      //Query contains required shopfloorid
    if(req.session.loggedin){
        var machinespromise = new Promise((resolve,reject)=>{
            connection.query('SELECT macid,mid FROM machines WHERE sid=?',[shopdetails.shopfloorid] ,(err,res)=>{
                if (err){
                    console.log(err);                       //If err
                    reject(err);
                }else{
                    // console.log(res);
                    resolve(res);                           //Resolve if successful
                }
            });
        });
        machinespromise.then((machines)=>{
            console.log(machines.length)

            for(i=0;i<machines.length;i++){
                var detailspromise = new Promise((resolve,reject)=>{ 
                    connection.query('SELECT PartNo, IPAddress FROM mac_para WHERE IPAddress=? ORDER BY mpid DESC',machines[i]["macid"] ,(err,res)=>{ //Fetch details
                        if (err){ 
                            console.log(err); 
                            reject(err); 
                        }
                        else{ // console.log(res); 
                            resolve(res);
                        } 
                        }); 
                        });
                detailspromise.then((params)=>{
                    machines[0].PartNo=JSON.stringify(params[0]["PartNo"])  

                    console.log(JSON.stringify(machines))
                    }, (err)=>{ 
                        res.send('err'); 
                        console.log(err); //if err send err });
                    })

                    // Object.keys(machines).forEach((key)=>{
                //     var detailspromise = new Promise((resolve,reject)=>{ 
                //         connection.query('SELECT pval_1 FROM pds_data WHERE IPAddress=? ORDER BY DESC FETCH FIRST ROW ONLY',[key.macid] ,(err,res)=>{ //Fetch details
                //             if (err){ 
                //                 console.log(err); 
                //                 reject(err); 
                //             }
                //             else{ // console.log(res); 
                //                     resolve(res);
                //             } 
                //             }); 
                //         });
                //         detailspromise.then((pdsdata)=>{ 
                //             key["CycleTime"]=pdsdata // console.log(JSON.parse(jsondata));                              
                //         }, (err)=>{ 
                //             res.send('err'); 
                //             console.log(err); //if err send err });
                //         }
                //         )
                //})
                // console.log(JSON.parse(jsondata));
        
                
                const jsondata=JSON.stringify(machines)
                console.log(JSON.stringify(jsondata))
                res.send(JSON.parse(jsondata));             //Sending corresponding machines in a shopfloor
        }}, (err)=>{
            res.send('err');
            console.log(err);                               //If err log err
        });
                
    }else{
        res.redirect('/');                                  //If not logged in redirect
                // MySqlEventWatcher.add('tnetdatabase.pds_data',(oldRow,newRow,event) =>{ 
                //         if (oldRow===null){ 
                            }
            });
//     }
// });

router.get('/showmachine', (req,res)=>{                     //To update macdata cookie value with selected machine and redirect to dashboard
    // console.log(JSON.parse(req.cookies.userdata));
    macdetails=JSON.parse(JSON.stringify(req.query));       //Corresponding mid is fetched from query
    if(req.session.loggedin){
        
        var detailspromise = new Promise((resolve,reject)=>{
            connection.query('SELECT macid FROM machines WHERE mid=?',[macdetails.machineid] ,(err,res)=>{      //Fetch details
                if (err){
                    console.log(err);
                    reject(err);
                }else{
                    // console.log(res);
                    resolve(res);
            
        
        }});
    });

        detailspromise.then((details)=>{
                jsondata = JSON.stringify(details)
                // console.log(JSON.parse(jsondata));
                res.cookie('macdata', jsondata);                //Update details of macdata cookie
                res.send({message:"fetched"});                  //Send fetched -> which will force frontend to redirect to dashboard
        }, (err)=>{
            res.send('err');
            console.log(err);                                   //if err send err
        });
    }else{
        res.send('err');                                        //if not logged in send err
    }
});

/*Function to choose a default machine
Updates the current user details with the mid of the machine he chooses as his default machine*/

router.get('/makedefault', (req,res)=>{
    var userdata = JSON.parse(req.cookies.userdata);        //userdata for uid
    var uid = userdata.uid;
    console.log(req.query);
    var mid = parseInt(req.query.machineid);
    connection.query('UPDATE users SET defaultmacid=? WHERE uid=?',[mid,uid],(err,result)=>{    //Update defaultmacid parameter in users
        if (err){
            console.log(err);                                                                   //If err send could not set default
            res.send({message:"Could not set default. Please try again"});
        }else{
            console.log(result);
            var detailspromise = new Promise((resolve,reject)=>{                                //Fetching macdata to update cookie and redirect to dashboard
                connection.query('SELECT * FROM machines WHERE mid=?',[mid] ,(err,res)=>{
                    if (err){
                        console.log(err);
                        reject(err);
                    }else{
                        // console.log(res);
                        resolve(res);
                    }
                });
            });
            detailspromise.then((details)=>{
                    jsondata = JSON.stringify(details)
                    // console.log(JSON.parse(jsondata));
                    res.cookie('macdata', jsondata);                                            //Updating cookievalue
                    res.send({message:"Default Machine Updated"});                              //Response will redirect to dashboard with new macdata
            }, (err)=>{
                console.log(err);   //Log err
            });
        }
    });
});

router.get('/deletemachine', (req,res)=>{                       //Delete machine with machineid parameter
    // console.log(JSON.parse(req.cookies.userdata));
    macdetails=JSON.parse(JSON.stringify(req.query));
    if(req.session.loggedin){
        var detailspromise = new Promise((resolve,reject)=>{
            connection.query('DELETE FROM machines WHERE mid=?',[macdetails.machineid] ,(err,res)=>{        //Query to delete
                if (err){
                    console.log(err);
                    reject(err.sqlMessage);     //if err
                }else{
                    // console.log(res);
                    resolve(res);               //if successful
                }
            });
        });
        detailspromise.then((details)=>{
                jsondata = JSON.stringify(details)
                // console.log(JSON.parse(jsondata));
                // res.cookie('macdata', jsondata);
                res.send({message:"deleted"});          //If deleted send deleted which will make frontend refresh view
        }, (err)=>{
            res.send('err');     //Could not delete
            console.log(err);
        });
    }else{
        res.send('err');        //If not logged in
    }
});

// router.get('/macpara',(req,res)=>{

//     if(req.session.loggedin){        
       
    
// }})

module.exports = router;