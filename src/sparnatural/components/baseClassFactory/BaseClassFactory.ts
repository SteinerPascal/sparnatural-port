/*
    The Factory decides which html tag a certain component gets. 
    Default value is <div class='[cssBaseClase]'></div>
    If you would like to register new htmlbaseclasses, do it here
    Here you can also register imported custom HTMLElements
*/
class BaseClassFactory {
    liTags:Array<string> = ['groupe']
    ulTags:Array<string> = ['componentsListe']
    constructor(){}

    getBaseClass(baseCssClass:string){
        let findCallBack = (el:string)=>{if(el == baseCssClass) return true}
        let html:JQuery<HTMLElement>
        switch(baseCssClass){
            case this.liTags.find(findCallBack):
                html = $('<li class="' + baseCssClass + '"></li>')
                break;
            case this.ulTags.find(findCallBack):
                html = $('<ul class="' + baseCssClass + '"></ul>')
            default:
                html = $('<div class="' + baseCssClass + '"></div>');
        }
        return html
    }
}
export default BaseClassFactory