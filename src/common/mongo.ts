// import { MongoClient, ServerApiVersion } from 'mongodb';
import * as Realm from "realm-web";

export class mongoAppApi {
  static app = new Realm.App(process.env.REALM_APP_ID ?? "application-0-acfww");

  public static async getAllIssues() {
    const credentials = Realm.Credentials.anonymous();
    try { 
      const user = await mongoAppApi.app.logIn(credentials);
      console.log("getAllIssues User Logged in ", user.id);
      const epd = await user.functions.getAllIssues();
      return epd;
    } catch (error) {
      console.log(error);
    }
  }

  public static async insertIssue(issueType: String, description: String, latitude: Number, longitude: Number, photo: string | undefined) {
    try { 
      const email = "cerenz.98@gmail.com";
      const password = "Pa55w0rd!";
      
      const credentials = Realm.Credentials.emailPassword(email, password);
      const user = await mongoAppApi.app.logIn(credentials);
      console.log("getAllIssues User Logged in ", user.id);
      const epd = await user.functions.insertIssue(issueType, description, latitude, longitude, photo);
      return epd;
    } catch (error) {
      throw error
    }
  }

  public static async getVotingResults() {
    try { 
      const email = "cerenz.98@gmail.com";
      const password = "Pa55w0rd!";

      const credentials = Realm.Credentials.emailPassword(email, password);
      const user = await mongoAppApi.app.logIn(credentials);

      return await user.functions.getVotingResults();
    } catch (error) {
      console.error("Failed to get voting results:", error);
      throw error;
    }
  }

  public static async submitVote(option: string) {
    try { 
      const email = "cerenz.98@gmail.com";
      const password = "Pa55w0rd!";

      const credentials = Realm.Credentials.emailPassword(email, password);
      const user = await mongoAppApi.app.logIn(credentials);
      
      return await user.functions.submitVote(option);
    } catch (error) {
      console.error("Failed to submit vote:", error);
      throw error;
    }
  }
}

