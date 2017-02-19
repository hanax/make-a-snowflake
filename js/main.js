var center, radius;
var leftTop, rightTop;
var piece = 10;
var angle = (360 / piece) * (Math.PI / 180);
var group;
var mouseMoveRotate = 0;

var path;
var cutPath;
var previewLine;
var cutAreaPreview;
var calCutAreaPreview;

var lastClickPoint;
var lastIntersectPoint;

initializePath();

function initializePath() {
  group = null;
  center = view.center;
  radius = view.size.height / 2 - 20;
  leftTop = new Point(center.x - Math.sin(angle / 2) * radius, center.y - Math.cos(angle / 2) * radius);
  rightTop = new Point(center.x + Math.sin(angle / 2) * radius, center.y - Math.cos(angle / 2) * radius);

  path = new Path({fillColor: 'white'});
  path.segments = [];
  path.add(center);
  path.add(leftTop);
  path.add(rightTop);
  path.closed = true;

  clearCutPath();
}

function onFrame(event) {
  if (group) {
    group.rotate(0.1 + mouseMoveRotate);
  }
}

// function isCutInside(p) {
//   return (p && p.y >= center.y && p.y <= rightTop.y && p.x >=  )
// }

function getIntersectLoc(p) {
  if (!p) return null;
  if (p.y === rightTop.y) {
    return 'top';
  } else if (p.x > view.center.x) {
    return 'right';
  } else if (p.x < view.center.x) {
    return 'left';
  } else return null;
}

function getCutEdgeLoc(p0, p1) {
  if (getIntersectLoc(p0) === getIntersectLoc(p1)) {
    return getIntersectLoc(p0);
  }
  if (getIntersectLoc(p0) === 'top' || getIntersectLoc(p1) === 'top') {
    if (getIntersectLoc(p0) === 'top') return 'top' + getIntersectLoc(p1);
    else return 'top' + getIntersectLoc(p0);
  }
  // p0 loc != p1 loc && both close to bottom
  if (p0 && p1 && center.y - p0.y < radius / 3 && center.y - p1.y < radius / 3) return 'bottom';
  return null;
}

function clearCutAreaPreview() {
  if (!cutAreaPreview) return;
  cutAreaPreview.remove();
  cutAreaPreview = null;
}

function clearCutPath() {
  if (previewLine) previewLine.remove();
  clearCutAreaPreview();
  if (cutPath) cutPath.remove();
  cutPath = new Path({strokeColor: '#C17979'});
  cutPath.segments = [];
  lastIntersectPoint = null;
  lastClickPoint = null;
}

function cutPaper() {
  if (!cutAreaPreview) return;
  var newPath = path.subtract(cutAreaPreview);
  newPath.fillColor = 'white';

  clearCutPath();

  path.remove();
  path = newPath;
}

function displayPreviewCutArea(intersections, p) {
  clearCutAreaPreview();
  calCutAreaPreview = cutPath.clone();
  if (calCutAreaPreview.segments.length === 1) calCutAreaPreview.segments = [];
  calCutAreaPreview.visible = false;
  for (var i = 0; i < intersections.length; i ++) {
    calCutAreaPreview.add(intersections[i].point);
  }
  if (p) calCutAreaPreview.add(p);

  calCutAreaPreview.closed = true;
  cutAreaPreview = path.intersect(calCutAreaPreview);
  cutAreaPreview.fillColor = '#C17979';
  cutAreaPreview.opacity = 0.2;
}

function errWarning(message) {
   this.message = message;
   this.name = 'errWarning';
}

function onMouseDown(event) {
  if (group) return;
  document.querySelector('.warning').innerText = '';
  try {
    // TODO: detect if first click inside the shape, ignore and warn
    lastClickPoint = event.point;
    cutPath.add(lastClickPoint);
    if (cutPath.segments.length < 2) return;

    var intersections = path.getCrossings(previewLine);
    if (intersections.length === 1) {
      lastIntersectPoint = intersections[0].point;
    } else if (intersections.length > 2) {
      throw new errWarning('please cut one piece at a time :)');
    }
    if (path.getCrossings(cutPath).length > 2) {
      throw new errWarning('ambiguous cut area');
    }

    cutPaper();
  } catch (e) {
    if (e.name === 'errWarning') console.log(e.message);
    document.querySelector('.warning').innerText = e.message;
    clearCutPath();
  }
}

function onMouseMove(event) {
  if (group) {
    mouseMoveRotate = Math.min(0.5, (event.point.y - center.y) / 200);
    return;
  }

  if (!lastClickPoint) return;
  if (previewLine) previewLine.remove();
  previewLine = new Path.Line(lastClickPoint, event.point);
  previewLine.strokeColor = '#C17979';

  var intersections = path.getCrossings(previewLine);
  if (intersections.length > 0 && intersections.length < 3) {
    var previewCutEdgeLoc;
    if (intersections.length === 2) {
      previewCutEdgeLoc = getCutEdgeLoc(intersections[0].point, intersections[1].point);
    } else {
      previewCutEdgeLoc = getCutEdgeLoc(intersections[0].point, lastIntersectPoint);
    }
    if (previewCutEdgeLoc === 'bottom') {
      displayPreviewCutArea(intersections, center);
    } else if (previewCutEdgeLoc === 'topleft') {
      displayPreviewCutArea(intersections, leftTop);
    } else if (previewCutEdgeLoc === 'topright') {
      displayPreviewCutArea(intersections, rightTop);
    } else if (previewCutEdgeLoc === 'left' || previewCutEdgeLoc === 'right' || previewCutEdgeLoc === 'top') {
      displayPreviewCutArea(intersections);
    } else {
      clearCutAreaPreview();
    }
  } else {
    clearCutAreaPreview();
  }
}

document.querySelector('#btn-display').addEventListener('click', function() {
  var paths = [];
  for (var i = 0; i < piece; i ++) {
    if (i % 2) paths.push(path.clone().rotate((360 / piece) * (i + 1), center));
    else paths.push(path.clone().scale(-1, 1, center).rotate((360 / piece) * (i + 1), center));
  }
  group = new Group(paths);
  path.remove();
  document.querySelector('#btn-display').style.display = 'none';
  document.querySelector('#btn-save').style.display = 'block';
});

document.querySelector('#btn-reset').addEventListener('click', function() {
  if (confirm('Are you sure?')) {
    document.querySelector('#btn-save').style.display = 'none'; 
    document.querySelector('#btn-display').style.display = 'block';
    if (group) group.removeChildren();
    initializePath();
  }
});

document.querySelector('#btn-save').addEventListener('click', function() {
  window.open(document.querySelector('canvas').toDataURL());
});
