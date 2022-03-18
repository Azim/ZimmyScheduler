
const color_regexp = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const url_regexp = /^(?:https?:\/\/|[%{])/;

export function isHexColor(value:string){
    return color_regexp.test(value);
}

export function isUrl(value:string){
    return url_regexp.test(value);
}