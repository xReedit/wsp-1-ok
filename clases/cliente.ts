export  class ClassCliente {    
    private nombre: string;
    private apellido: string;
    private celular: string;
    private direcciones: string[];
    private direccionSeleccionada: any;
    private referencia_de_direccion: string
    private ruc: string;
    private idcliente: number;
    private isregister: boolean;
    private nombre_pila: string;   
    private num_personas: number;
    private hora_llegada: string; 
    private isDireccionRegistrada: boolean = false;
    private idcliente_pwa_direccion: number = 0;

    constructor(nombre: string = '', apellido: string = '', celular: string = '', direcciones: string[] = [''], ruc: string = '', idcliente: number = 0, isregister: boolean = false, referencia_de_direccion: string = '', num_personas: number = 0, hora_llegada: string = '', isDireccionRegistrada: boolean = false, idcliente_pwa_direccion: number = 0, nombre_pila: string = '', direccionSeleccionada: any = {} ) {  
        this.nombre = nombre;
        this.nombre_pila = nombre_pila;
        this.apellido = apellido;
        this.celular = celular;
        this.direcciones = direcciones;
        this.ruc = ruc;
        this.direccionSeleccionada = direccionSeleccionada;
        this.idcliente = idcliente;
        this.isregister = isregister;                
        this.referencia_de_direccion = referencia_de_direccion;
        this.num_personas = num_personas;
        this.hora_llegada = hora_llegada;
        this.isDireccionRegistrada = isDireccionRegistrada;
        this.idcliente_pwa_direccion = idcliente_pwa_direccion;
    }

    public setCliente(cliente: any) {
        this.nombre = cliente.nombre;
        this.nombre_pila = cliente.nombre_pila;
        this.apellido = cliente.apellido;
        this.celular = cliente.celular;
        this.direcciones = cliente.direcciones;
        this.ruc = cliente.ruc;
        this.idcliente = cliente.idcliente;
        this.isregister = cliente.isregister;
        this.referencia_de_direccion = cliente.referencia_de_direccion;
        this.num_personas = cliente.num_personas;
        this.hora_llegada = cliente.hora_llegada;
        this.isDireccionRegistrada = cliente.isDireccionRegistrada;
        this.idcliente_pwa_direccion = cliente.idcliente_pwa_direccion;
        this.direccionSeleccionada = cliente.direccionSeleccionada;
    }

    public getNombre(): string {
        return this.nombre;
    }

    public setNombre(nombre: string): void {
        this.nombre = nombre;
    }

    public getApellido(): string {
        return this.apellido;
    }

    public setApellido(apellido: string): void {
        this.apellido = apellido;
    }

    public getCelular(): string {
        return this.celular;
    }

    public setCelular(celular: string): void {
        this.celular = celular;
    }

    public getDirecciones(): string[] {
        return this.direcciones;
    }

    public setDirecciones(direcciones: string[]): void {
        this.direcciones = direcciones;
    }

    public getDireccionSelected(): any {
        return this.direccionSeleccionada;
    }

    public setDireccionSelected(direccion: any): void {
        this.direccionSeleccionada = direccion;
    }

    public getIdCliente(): number {
        return this.idcliente;
    }   

    public setIdCliente(idcliente: number): void {
        this.idcliente = idcliente;
    }   

    public getIsRegister(): boolean { 
        return this.isregister;
    }   

    public setIsRegister(isregister: boolean): void {   
        this.isregister = isregister;
    }   

    public getRuc(): string {
        return this.ruc;
    }

    public setRuc(ruc: string): void {
        this.ruc = ruc;
    }

    public setNombrePila(nombre_pila: string) {
        this.nombre_pila = nombre_pila;
    }

    getNombrePila() {
        return this.nombre_pila || '';
    }

    public setReferenciaDireccion(referencia_de_direccion: string) {
        this.referencia_de_direccion = referencia_de_direccion;
    }

    public getReferenciaDireccion() {
        return this.referencia_de_direccion;
    }

    public setNumPersonas(num_personas: number) {
        this.num_personas = num_personas;
    }

    public getNumPersonas() {
        return this.num_personas;
    }

    public setHoraLlegada(hora_llegada: string) {
        this.hora_llegada = hora_llegada;
    }

    public getHoraLlegada() {
        return this.hora_llegada;
    }

    public setIsDireccionRegistrada(isDireccionRegistrada: boolean) {
        this.isDireccionRegistrada = isDireccionRegistrada;
    }

    public getIsDireccionRegistrada() {
        return this.isDireccionRegistrada;
    }

    public setIdClientePwaDireccion(idcliente_pwa_direccion: number) {
        this.idcliente_pwa_direccion = idcliente_pwa_direccion;
    }

    public getIdClientePwaDireccion() {
        return this.idcliente_pwa_direccion;
    }

       

}

// Ejemplo de uso
// const direccionesCliente: string[] = ['Dirección 1', 'Dirección 2'];
// const cliente = new Cliente('Juan', 'Pérez', '123456789', direccionesCliente);

// console.log(cliente.getNombre()); // Juan
// console.log(cliente.getDirecciones()); // ['Dirección 1', 'Dirección 2']

// cliente.setNombre('Pedro');
// cliente.setDirecciones(['Dirección 3']);

// console.log(cliente.getNombre()); // Pedro
// console.log(cliente.getDirecciones()); // ['Dirección 3']
