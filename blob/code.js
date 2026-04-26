

var nodes = [];
var links = [];
var world = [];



var torque = 0; 
var squeeze = 0;


var t_phys_loop = 0;

const GRAVITY = 15.5;
const DRAG = 0.995;


function dist( posA, posB ){
    const dx = posA.x - posB.x;
    const dy = posA.y - posB.y;
    return Math.sqrt( dx*dx + dy*dy  );
}

function get_unit_vector( posA, posB ){
    const dx = posA.x - posB.x;
    const dy = posA.y - posB.y;
    const dst = Math.sqrt( dx*dx + dy*dy ) + 1e-3;

    return {x: dx/dst, y: dy/dst}; 

}



class Node {
    constructor( pos ){
        this.pos = pos;
        this.vel = {x: 0.0, y: 0.0};
        this.F = {x: 0.0, y: 0.0};
        this.accel = {x: 0.0, y: 0.0};
        this.m = 1.0;
    }

    update( dt ){

        
        this.pos.x += this.vel.x*dt + 0.5 * this.accel.x*dt*dt;
        this.pos.y += this.vel.y*dt + 0.5 * this.accel.y*dt*dt;
        
        this.vel.x += 0.5*this.accel.x*dt;
        this.vel.y += 0.5*this.accel.y*dt;


        const ax = this.F.x / this.m;
        const ay = this.F.y / this.m;
        
        
        this.vel.x += 0.5 * ax * dt;
        this.vel.y += 0.5 * ay * dt;
        

        this.accel.x = ax;
        this.accel.y = ay;
        
        this.vel.x *= DRAG * ( 1 - 0.05*squeeze);
        this.vel.y *= DRAG * ( 1 - 0.05*squeeze);
        
        
        this.F = {x: 0.0, y: 0.0};
        
    }
}


class Link {
    constructor( nodeA, nodeB, L, k ){
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        this.L = L;
        this.trueL = L;
        this.k = k;
        this.prev_dl = 0;
    }

    update( dt ){
        const d = dist( this.nodeA.pos, this.nodeB.pos );
        const delta_l = this.L - d;
        const uv = get_unit_vector( this.nodeA.pos, this.nodeB.pos );


        const damp = (delta_l - this.prev_dl) * 0.075 / dt * (1 + 5.75*squeeze);

        this.prev_dl = delta_l;

        const f = delta_l * this.k * (1 + 0.25*squeeze) + damp;

        this.nodeA.F.x += uv.x * f;
        this.nodeA.F.y += uv.y * f;
        
        this.nodeB.F.x -= uv.x * f;
        this.nodeB.F.y -= uv.y * f;
        
    }

}


class WSphere {
    constructor( pos, radius ){
        this.pos = pos;
        this.radius = radius;
    }

    handle( node ){
        const d = dist( this.pos, node.pos ) - this.radius;
        const uv = get_unit_vector( node.pos, this.pos );

        if( d < -5e-1 ){
            const nx = this.pos.x + uv.x*this.radius;
            const ny = this.pos.y + uv.y*this.radius;
            
            node.pos.x = nx;
            node.pos.y = ny;
            

        }

        if( d < 5e-1 && true){

            const dotprd = node.vel.x * uv.x + node.vel.y * uv.y;
            const dotprdN = node.vel.x * -uv.y + node.vel.y * uv.x;


            const vel_len = dist(node.vel, {x: 0, y:0 });

            const project_vx = node.vel.x * dotprd / vel_len;
            const project_vy = node.vel.y * dotprd / vel_len;
            
            const project_nvx = node.vel.x * dotprdN / vel_len;
            const project_nvy = node.vel.y * dotprdN / vel_len;
            

            node.vel.x += project_vx*1.0;
            node.vel.y += project_vy*1.0;

            
            //node.F.x -= -project_nvx*3.75;
            //node.F.y -= -project_nvy*3.75;
            


            //node.vel.x -= 0.5 * project_nvx;
            //node.vel.y -= 0.5 * project_nvy;
            //node.vel.x -= 0.5 * project_nvx;
           //node.vel.y -= 0.5 * project_nvy;
            
        }

    }
}




function handle_physics( dt ){

    if( dt > (1000/30.0)) { dt = 1000/30.0; }

    dt /= 3e2;


    
    /* World collisions */
    for( let i = 0; i < world.length ; i += 1 ){
        for( let j = 0; j < nodes.length; j += 1 ){
            world[i].handle( nodes[j] );
        }
    }


    /* Handle springs / links */
    for( let i = 0 ; i < links.length ; i += 1 ){
        links[i].update( dt );
    }

    /* Apply gravity */
    for( let i = 0 ; i < nodes.length ; i += 1 ){
        nodes[i].F.y += GRAVITY;
    }


    let cx = 0.0;
    let cy = 0.0;
    for( let i = 0 ; i < nodes.length ; i += 1 ){
        cx += nodes[i].pos.x;
        cy += nodes[i].pos.y;   
    }
    
    cx /= nodes.length;
    cy /= nodes.length;
    let centre = {x: cx, y: cy};

    for( let i = 0 ; i < nodes.length ; i += 1 ){
        const uv = get_unit_vector( nodes[i].pos, centre );

        nodes[i].F.x += -uv.y * torque * 25;
        nodes[i].F.y += uv.x * torque * 25;
        
    }
    
    



    /* Node movement */
    for( let i = 0 ; i < nodes.length ; i += 1 ){
        nodes[i].update( dt );
    }

    return centre;
}





function render(offset_x, offset_y){
    const canvas = document.getElementById("gfx");
    const ctx = canvas.getContext("2d");

    canvas.width = 0.8 * window.innerWidth;
    canvas.height = 0.75 * window.innerHeight;

    const cW = canvas.width / 2;
    const cH = canvas.height / 2;
    
    

    /* Clear screen */
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    /* Draw links */

    if( squeeze > 0 ){
        ctx.strokeStyle = "#111155";
    }
    else { ctx.strokeStyle = "black"; }

    for( let i = 0 ; i < links.length ; i += 1){
        
        const nx0 = links[i].nodeA.pos.x + cW - offset_x;
        const ny0 = links[i].nodeA.pos.y + cH - offset_y;
        
        const nx1 = links[i].nodeB.pos.x + cW - offset_x;
        const ny1 = links[i].nodeB.pos.y + cH - offset_y;
        
        
        ctx.beginPath();
        ctx.moveTo( nx0, ny0 );
        ctx.lineTo( nx1, ny1 );
        ctx.stroke();
    }



    /* Draw nodes */

    ctx.fillStyle = "red";
    for( let i = 0 ; i < nodes.length ; i += 1 ){
        const nx = nodes[i].pos.x + cW - offset_x;
        const ny = nodes[i].pos.y + cH - offset_y;
        
        ctx.beginPath();
        ctx.ellipse( nx, ny, 4, 4, 0, 0, 2*Math.PI );
        ctx.closePath();
        ctx.fill();
    }


    /* Draw world */

    ctx.fillStyle = "#ccccdd";
    
    for( let i = 0; i < world.length ; i+= 1 ){
        const nx = world[i].pos.x + cW - offset_x;
        const ny = world[i].pos.y + cH - offset_y;
        
        ctx.beginPath();
        ctx.ellipse( nx, ny, world[i].radius, world[i].radius, 0, 0, 2*Math.PI );
        ctx.closePath();
        ctx.fill();

    }

}


function init(){
    /*const nodeA = new Node({x: -100, y: 10});
    const nodeB = new Node({x: 100, y: 200});
    
    nodes.push( nodeA );
    nodes.push( nodeB );

    links.push( new Link(nodeA, nodeB, 180, 0.0001 ) );
    */

    for( let i = 0 ; i < 10 ; i += 1 ){
        const phi = 2*Math.PI/10.0 * i;
        const px = 40 * Math.cos( phi ) * (1 + 0.21*(i % 2));
        const py = 40 * Math.sin( phi ) * (1 + 0.21*(i % 2));
        
        const nd = new Node({x: px, y: py - 50});

        /*
        const vx = Math.sin( phi );
        const vy = -Math.cos( phi );

        nd.vel.x = 5*vx;
        nd.vel.y = 5*vy;
        */


        nodes.push( nd );
    }


    for( let i = 0 ; i < nodes.length - 1 ; i += 1 ){
        for( let j = i+1; j < nodes.length ; j += 1 ){
            const d = dist( nodes[i].pos, nodes[j].pos );
            if( d < 80 ) {
                links.push( new Link( nodes[i], nodes[j], d, 2.0 ) );
                }
        }
    }


    world.push(  new WSphere( {x: -350, y: 100}, 250 )  );
    world.push(  new WSphere( {x: -150, y: 350}, 250 )  );
    world.push(  new WSphere( {x: 0, y: 350}, 250 )  );
    world.push(  new WSphere( {x: 150, y: 350}, 250 )  );

    world.push(  new WSphere( {x: 300, y: 400}, 250 )  );
    world.push(  new WSphere( {x: 450, y: 370}, 250 )  );
    world.push(  new WSphere( {x: 600, y: 300}, 250 )  );

    world.push(  new WSphere( {x: 700, y: 500}, 250 )  );

    world.push(  new WSphere( {x: 900, y: 800}, 250 )  );
    world.push(  new WSphere( {x: 700, y: 800}, 250 )  );
    world.push(  new WSphere( {x: 1100, y: 800}, 250 )  );

    world.push(  new WSphere( {x: 1400, y: 800}, 250 )  );
    world.push(  new WSphere( {x: 1800, y: 700}, 250 )  );
    world.push(  new WSphere( {x: 2000, y: 600}, 250 )  );
    world.push(  new WSphere( {x: 2000, y: 30}, 250 )  );

}




init();

let _prev_frame_timestamp;
let global_x = 0;
let global_y = 0;


function main_loop( timestamp ){
    const dt = timestamp - _prev_frame_timestamp;
    if( dt < 1/60.0 ){ requestAnimationFrame( main_loop ); return; }
    
    _prev_frame_timestamp = timestamp;

    
    const t_phys_start = Date.now();
    let centre;
    for( let i = 0 ; i < 9 ; i += 1 ){
        centre = handle_physics( dt / 4 );
    }

    t_phys_loop = (Date.now()) - t_phys_start;

    render( centre.x, centre.y );


    if( centre.y > 2000 ){

        nodes.length = 0;
        links.length = 0;
        world.length = 0;
        init();
    }

    requestAnimationFrame( main_loop );
    
}



const elem = document.getElementsByTagName("body")[0];
elem.addEventListener("keydown", function(e){
    //console.log("keydown", e.code );
    switch(e.code){
        case "ArrowLeft":
        torque = -1.0;    
        break;
        case "ArrowRight":
        torque = 1.0;    
        break;

        case "Space":
        squeeze = 1;
        break;
    }
});

elem.addEventListener("keyup", function(e){
    //console.log("keydown", e.code );
    switch(e.code){
        case "ArrowLeft":
        torque = 0.0;    
        break;
        case "ArrowRight":
        torque = 0.0;    
        break;
        case "Space":
        squeeze = 0;
        break;
    }
});



document.getElementById("left-button").addEventListener("pointerdown", function(e){
    torque = -1.0;     
});

document.getElementById("left-button").addEventListener("touchstart", function(e){
    torque = -1.0;  
    e.preventDefault();
    e.stopPropagation();     
});



document.getElementById("left-button").addEventListener("pointerup", function(e){
    torque = 0.0;     
});

document.getElementById("right-button").addEventListener("pointerdown", function(e){
    torque = 1.0;     
});



document.getElementById("right-button").addEventListener("touchstart", function(e){
    torque = 1.0;     
    e.preventDefault();
    e.stopPropagation();     
});


document.getElementById("right-button").addEventListener("pointerup", function(e){
    torque = 0.0;     
});



document.getElementById("center-button").addEventListener("pointerdown", function(e){
    squeeze = 1;
});

document.getElementById("center-button").addEventListener("touchstart", function(e){
    squeeze = 1;
    e.preventDefault();
    e.stopPropagation();     
});


document.getElementById("center-button").addEventListener("pointerup", function(e){
    squeeze = 0;     
});




function firstFrame( timestamp ){
    _prev_frame_timestamp = timestamp;
    main_loop( timestamp );
}


 
requestAnimationFrame( firstFrame );
