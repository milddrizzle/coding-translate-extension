import { languages } from "vscode";
import { shortLive } from "./complie";

export function registerDefinition(canLanguages:string[] = []) {
    languages.registerDefinitionProvider(canLanguages, {
        provideDefinition:(document)=>{
            shortLive.add(document.uri.toString());
            return null;
        }
    })
}