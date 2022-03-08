var vertex_y0=[-10.0,
    -3.0901699437494745,
    8.090169943749473,
    8.090169943749476,
    -3.0901699437494723];
var vertex_x0=[0.0,
    9.510565162951535,
    5.877852522924733,
    -5.87785252292473,
    -9.510565162951536];


var vertex_y=[-10.0,
    -3.0901699437494745,
    8.090169943749473,
    8.090169943749476,
    -3.0901699437494723];
var vertex_x=[0.0,
    9.510565162951535,
    5.877852522924733,
    -5.87785252292473,
    -9.510565162951536];

dt=0.04;
motion_r=[1,1,1,1,1];
phi=[0.0, 0.0, 0.0, 0.0, 0.0];
dphi=[];
for (d of [Math.sqrt(10000),Math.sqrt(10300),Math.sqrt(10600),Math.sqrt(10700),Math.sqrt(10900)]){
    dphi.push(3.0*d/180.*Math.PI*dt);
}

var small_svg_circles=[];
var large_svg_circle=[];
var lines=[];
var handles=[];
var run_animate=false;

const Flatten = globalThis["@flatten-js/core"];
const {point, circle, segment, line} = Flatten;
const svg=SVG("#svg")
const svg_page=document.getElementById("svg");

const colors=["red", "green", "blue", "yellow", "cyan"]

function mod(i,m){
    let x=i%m;
    if (x<0){
        return x+m;
    }else{
        return x;
    }
}

function det_left2(a11,a12,
                   a21,a22,
                   a31,a32){
    return a11*a22+a12*a31+a21*a32-a31*a22-a32*a11-a21*a12
}


function three_points_to_circle(p1, p2, p3){
    const z1=p1.x*p1.x+p1.y*p1.y;
    const z2=p2.x*p2.x+p2.y*p2.y;
    const z3=p3.x*p3.x+p3.y*p3.y;
    const m=2*det_left2(p1.x,p1.y,p2.x,p2.y,p3.x,p3.y);
    const cx=det_left2(z1,p1.y,z2,p2.y,z3,p3.y)/m;
    const cy=det_left2(p1.x, z1, p2.x,z2, p3.x, z3)/m;
    const r=point(cx,cy).distanceTo(p1)[0]
    return circle(point(cx,cy),r)
}

function small_circle(xlist, ylist, i){
    line_left=line(point(xlist[mod(i-2, 5)], ylist[mod(i-2, 5)]), point(xlist[mod(i, 5)], ylist[mod(i, 5)]));
    line_right=line(point(xlist[mod(i, 5)], ylist[mod(i, 5)]), point(xlist[mod(i+2, 5)], ylist[mod(i+2, 5)]));
    line_self=line(point(xlist[mod(i-1, 5)], ylist[mod(i-1, 5)]), point(xlist[mod(i+1, 5)], ylist[mod(i+1, 5)]));
    p_left=line_left.intersect(line_self)[0];
    p_right=line_right.intersect(line_self)[0];
    p_self=point(xlist[i], ylist[i]);
    return three_points_to_circle(p_self, p_left, p_right);
}

function large_circle(small_circles){
    var xwc=0;
    var ywc=0;
    for (c of small_circles){
        xwc+=c.pc.x;
        ywc+=c.pc.y;
    }
    xwc/=5;
    ywc/=5;
    var intersect_points=[];
    const wc=point(xwc, ywc);
    for(var i=0;i<5;++i){
        let c1=small_circles[i%5];
        let c2=small_circles[(i+1)%5];
        let intersects=c1.intersect(c2);
        let d1=intersects[0].distanceTo(wc);
        let d2=intersects[1].distanceTo(wc);
        if (d1>d2){
            intersect_points.push(intersects[0]);
        }else{
            intersect_points.push(intersects[1]);
        }
    }
    
    return three_points_to_circle(intersect_points[0], intersect_points[2], intersect_points[4]);
}

function loc(evt){
    var pt = svg_page.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg_page.getScreenCTM().inverse());
}

function init(){
    for (var i=0; i < 5; ++i){
        line_id="line"+i;
        
        lines.push(document.getElementById(line_id));
        circle_id="circle"+i;
        small_svg_circles.push(document.getElementById(circle_id));
        handle=document.getElementById("handle"+i)
        handle.setAttribute("cx", vertex_x[mod(i, 5)]);
        handle.setAttribute("cy", vertex_y[mod(i, 5)]);
        
        handle.addEventListener("mousemove", (function(i){
            return function (evt){
                if (evt.buttons==1){
                    //console.log(loc(evt));
                    var p=loc(evt);
                    //console.log(i);
                    vertex_x[i]=p.x;
                    vertex_y[i]=p.y;
                    update();
                    handles[i].setAttribute("cx", p.x);
                    handles[i].setAttribute("cy", p.y);
                    handles[i].setAttribute("class", "active_handle");
                }
            };
        })(i));
        handle.addEventListener("mouseup", (function(i){
            return function (evt){
                handles[i].setAttribute("class", "inactive_handle");
            };
        })(i));
        handle.addEventListener("mousedown", (function(i){
            return function (evt){
                handles[i].setAttribute("class", "active_handle");
            };
        })(i));
        handles.push(handle);
    }
    large_svg_circle.push(document.getElementById("large_circle"));
    update();

    svg_page.addEventListener("dblclick", function(evt){
        run_animate^=true;
        //console.log(run_animate);
    });

    setInterval(animate, dt*1000);

}

function animate(){
    if (run_animate){
        for(var i=0;i<5;++i){
            phi[i]+=dphi[i];
            vertex_x[i]=vertex_x0[i]+motion_r[i]*Math.cos(phi[i]);
            vertex_y[i]=vertex_y0[i]+motion_r[i]*Math.sin(phi[i]);
        }
        update();
    }
    
}

function update() {
    var small_circles=[];
    for (var i=0;i < 5; ++i){        
        lines[i].setAttribute("x1", vertex_x[mod(i-1,5)]);
        lines[i].setAttribute("y1", vertex_y[mod(i-1,5)]);
        lines[i].setAttribute("x2", vertex_x[mod(i+1,5)]);
        lines[i].setAttribute("y2", vertex_y[mod(i+1,5)]);
        lines[i].setAttribute("stroke", "black");
        const c=small_circle(vertex_x, vertex_y, i);
        //svg.circle(c.r*2).stroke({color:"red", width:0.1}).fill('none').center(c.pc.x, c.pc.y);
        small_svg_circles[i].setAttribute("cx", c.pc.x);
        small_svg_circles[i].setAttribute("cy", c.pc.y);
        small_svg_circles[i].setAttribute("r", c.r);
        small_circles.push(c);
        handles[i].setAttribute("cx", vertex_x[i]);
        handles[i].setAttribute("cy", vertex_y[i]);
    }
    let C=large_circle(small_circles);
    large_svg_circle[0].setAttribute("cx", C.pc.x);
    large_svg_circle[0].setAttribute("cy", C.pc.y);
    large_svg_circle[0].setAttribute("r", C.r);

    //svg.circle(C.r*2).stroke({color:"green", width:0.1}).fill('none').center(C.pc.x, C.pc.y);
}
