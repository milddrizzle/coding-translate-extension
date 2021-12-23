import { Hover, languages, MarkdownString, Range } from "vscode";
import { getConfig } from "../configuration";
import { client } from "../extension";

export interface ITranslateHover {
	originText: string;
	translatedText: string;
	translatedLink: string;
	humanizeText?: string;
	range: Range;
}

let last: Map<string, Hover> = new Map();
export function registerHover(canLanguages:string[] = []) {

    languages.registerHoverProvider(canLanguages, {
        async provideHover(document, position) {
            
            const uri = document.uri.toString();
            const res = await client.sendRequest<ITranslateHover | null>('getHover', {
                textDocument: {
                    uri: uri
                },
                position
            });
            if(!res) return null;
            let {translatedText,translatedLink,humanizeText,range} = res;
            const base64TranslatedText = Buffer.from(translatedText).toString('base64');
            const separator = ' &nbsp;&nbsp;|&nbsp;&nbsp; ';
            let replace = `[$(replace)](command:commentTranslate._replaceRange?${encodeURIComponent(JSON.stringify({uri,range,text:base64TranslatedText}))} "Replace")`;

            let multiLine = await getConfig<boolean>('multiLineMerge');
            let combine = `[$(${multiLine?'selection':'remove'})](command:commentTranslate._toggleMultiLineMerge "Toggle Combine Multi Line")`;

            let setting = `[$(settings-gear)](command:workbench.action.openWorkspaceSettings?${encodeURIComponent(JSON.stringify({query:'commentTranslate'}))} "Open Comment Translate setting")`;

            let translate = `[$(sync)](command:commentTranslate._changeTranslateSource "Change translate source")`;

            let header = new MarkdownString(`[Comment Translate]&nbsp;&nbsp;${replace}&nbsp;&nbsp;${combine}&nbsp;&nbsp;${setting}${separator}${translate}&nbsp;&nbsp;${translatedLink}`,true);
            header.isTrusted = true;

            let md = new MarkdownString(`\`\`\`${document.languageId} \n${translatedText} \n \`\`\``);
            if(humanizeText) {
                md = new MarkdownString(`\`\`\`${document.languageId} \n ${humanizeText} => ${translatedText} \n \`\`\``);
            }
            const hover = new Hover([header,md], range);
            last.set(uri, hover);
            return hover;
        }
    });

}

export function lastHover(uri:string) {
	return last.get(uri);
}