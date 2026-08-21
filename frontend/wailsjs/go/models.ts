export namespace main {
	
	export class GuardarUsuarioInput {
	    id_user: number;
	    username: string;
	    psw: string;
	    name: string;
	    zone: string;
	    email: string;
	    id_plan: number;
	    detalle: string;
	    permisos: models.PermisoInput[];
	
	    static createFrom(source: any = {}) {
	        return new GuardarUsuarioInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id_user = source["id_user"];
	        this.username = source["username"];
	        this.psw = source["psw"];
	        this.name = source["name"];
	        this.zone = source["zone"];
	        this.email = source["email"];
	        this.id_plan = source["id_plan"];
	        this.detalle = source["detalle"];
	        this.permisos = this.convertValues(source["permisos"], models.PermisoInput);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace models {
	
	export class CreatedUser {
	    id_user: number;
	    username: string;
	    psw: string;
	
	    static createFrom(source: any = {}) {
	        return new CreatedUser(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id_user = source["id_user"];
	        this.username = source["username"];
	        this.psw = source["psw"];
	    }
	}
	export class FuncionPermiso {
	    id_funct: number;
	    modulo: string;
	    funcion: string;
	    autorizada: boolean;
	
	    static createFrom(source: any = {}) {
	        return new FuncionPermiso(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id_funct = source["id_funct"];
	        this.modulo = source["modulo"];
	        this.funcion = source["funcion"];
	        this.autorizada = source["autorizada"];
	    }
	}
	export class Modulo {
	    id_modulo: number;
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new Modulo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id_modulo = source["id_modulo"];
	        this.name = source["name"];
	    }
	}
	export class ModuloFuncion {
	    id_modulo: number;
	    modulo: string;
	    id_funct?: number;
	    funcion?: string;
	
	    static createFrom(source: any = {}) {
	        return new ModuloFuncion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id_modulo = source["id_modulo"];
	        this.modulo = source["modulo"];
	        this.id_funct = source["id_funct"];
	        this.funcion = source["funcion"];
	    }
	}
	export class NewUserInput {
	    alias: string;
	    email: string;
	    name: string;
	    zone: string;
	    company: string;
	    detalle: string;
	
	    static createFrom(source: any = {}) {
	        return new NewUserInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.alias = source["alias"];
	        this.email = source["email"];
	        this.name = source["name"];
	        this.zone = source["zone"];
	        this.company = source["company"];
	        this.detalle = source["detalle"];
	    }
	}
	export class PermisoInput {
	    id_funct: number;
	    autorizada: boolean;
	
	    static createFrom(source: any = {}) {
	        return new PermisoInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id_funct = source["id_funct"];
	        this.autorizada = source["autorizada"];
	    }
	}
	export class Plan {
	    id_plan: number;
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new Plan(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id_plan = source["id_plan"];
	        this.name = source["name"];
	    }
	}
	export class RecordStat {
	    modulo: string;
	    funcion: string;
	    total: number;
	
	    static createFrom(source: any = {}) {
	        return new RecordStat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.modulo = source["modulo"];
	        this.funcion = source["funcion"];
	        this.total = source["total"];
	    }
	}
	export class RecordRow {
	    id_record: number;
	    id_user: number;
	    status: string;
	    date: string;
	
	    static createFrom(source: any = {}) {
	        return new RecordRow(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id_record = source["id_record"];
	        this.id_user = source["id_user"];
	        this.status = source["status"];
	        this.date = source["date"];
	    }
	}
	export class RecordPage {
	    rows: RecordRow[];
	    total: number;
	
	    static createFrom(source: any = {}) {
	        return new RecordPage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.rows = this.convertValues(source["rows"], RecordRow);
	        this.total = source["total"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class User {
	    id_user: number;
	    username: string;
	    email: string;
	    name: string;
	    plan: string;
	    zone: string;
	    psw: string;
	    detalle: string;
	    id_plan: number;
	
	    static createFrom(source: any = {}) {
	        return new User(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id_user = source["id_user"];
	        this.username = source["username"];
	        this.email = source["email"];
	        this.name = source["name"];
	        this.plan = source["plan"];
	        this.zone = source["zone"];
	        this.psw = source["psw"];
	        this.detalle = source["detalle"];
	        this.id_plan = source["id_plan"];
	    }
	}

}

