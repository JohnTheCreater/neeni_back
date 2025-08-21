const {spawn} = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const cron = require('node-cron');

const backup = ()=>{
    cron.schedule('48 19 * * *',()=>{
         createBackup();
})

}



const createBackup = async()=>{

    const {DBUSER,DBPASSWORD,DBNAME} = process.env;
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `backup_${date}.sql`;
    const backupDir = './backups';
    
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }
    
    const filePath = path.join(backupDir, fileName);
    
    const dump = spawn('mysqldump',[
        '-u',
        DBUSER,
        `-p${DBPASSWORD}`, 
        DBNAME  
    ]);
    
    dump.stdout.pipe(fs.createWriteStream(filePath))
        .on('finish', () => {
            console.log(`✅ Backup created: ${fileName}`);
            keepOnlyTwoBackups(backupDir);
        })
        .on('error', (err) => {
            console.error('❌ Error: No Backup File Generated!', err);
        });

}

const keepOnlyTwoBackups = (backupDir) => {
    try {
        const files = fs.readdirSync(backupDir)
            .filter(file => file.startsWith('backup_') && file.endsWith('.sql'))
            .map(file => ({
                name: file,
                time: fs.statSync(path.join(backupDir, file)).mtime 
            }))
            .sort((a, b) => b.time - a.time); 
        
        const filesToDelete = files.slice(2);
        
        filesToDelete.forEach(file => {
            fs.unlinkSync(path.join(backupDir, file.name));
            console.log(`🗑️ Deleted: ${file.name}`);
        });
        
    } catch (error) {
        console.error('Error managing backups:', error);
    }
};

module.exports = { backup };