import { Logger } from "@/services/logger.service";
import { mongoose } from "@typegoose/typegoose";

export async function initDB() {
    let user = <string> process.env.db_user;
    let pass = <string> process.env.db_pass;
    let name = <string> process.env.db_name;
    let port = <string> process.env.db_port;
    
    let mongo = await mongoose.connect(`mongodb://${user}:${pass}@localhost:${port}/${name}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    Logger.info(`Created Connection: ${(mongo.connection.db.databaseName)}`);
}