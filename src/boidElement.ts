import * as THREE from 'three';
import { MathUtils, RGBA_ASTC_10x10_Format, Scene, Vector3 } from 'three';
import { SkeletonUtils } from '../node_modules/three/examples/jsm/utils/SkeletonUtils';

class boidElement {
  _velocity = new Vector3(Math.random() - 0.2, 0, Math.random() - 0.2).normalize();
  _acceleration = new Vector3(Math.random() * 0.5, 0, Math.random() * 0.5);
  _obj: THREE.Object3D = new THREE.Object3D();
  _forward: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
  get obj(): THREE.Object3D {
    return this._obj;
  }
  private get velocity(): THREE.Vector3 {
    return this._velocity.clone();
  }
  private get acceleration(): THREE.Vector3 {
    return this._acceleration.clone();
  }
  private get forward(): THREE.Vector3 {
    var dir = this._forward.applyQuaternion(this._obj.quaternion);
    return dir;
  }

  private mixer;

  public async init(objData: THREE.Object3D) {
    await Promise.resolve(SkeletonUtils.clone(objData)).then((cloneObj) => {
      this._obj = cloneObj;

      this._obj.animations = objData.animations;
      this.mixer = new THREE.AnimationMixer(this._obj);
      this.mixer.timeScale = THREE.MathUtils.randFloat(1, 1.2);

      //-------------add init rotation------------------------
      let rotation = Math.random() * 2 * Math.PI;
      let q = new THREE.Quaternion();
      q.setFromAxisAngle(new Vector3(0, 1, 0), rotation);
      this._obj.rotation.setFromQuaternion(q);
      //------------------------------------------------------

      const action = this.mixer.clipAction(this._obj.animations[0]);
      action.setLoop(THREE.LoopRepeat);
      const material = new THREE.MeshPhongMaterial({ color: 'rgb(255, 0, 0)' });
      material.skinning = true;

      action.play();

      this._obj.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          (<THREE.Mesh>child).material = material;
        }
      });

      this._obj.scale.setScalar(0.05);
      this._obj.position.set(
        THREE.MathUtils.randFloat(-10, 10),
        //THREE.MathUtils.randFloat(-10, 10),
        0,
        THREE.MathUtils.randFloat(-10, 10)
      );

      //add axis
      // var axis = new THREE.AxesHelper(15);
      // cloneObj.add(axis);
    });
  }

  addLineObj(startPos: THREE.Vector3, endPos: THREE.Vector3, color: THREE.Color) {
    const mat = new THREE.LineBasicMaterial({
      color: color,
    });
    const points: Vector3[] = [];
    points.push(startPos);
    points.push(endPos);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, mat);
    return line;
  }

  calcRotation() {
    let dot = this.velocity.normalize().dot(new Vector3(0, 0, 1));
    var rad = Math.acos(dot);
    //var cross = this.velocity.cross(new THREE.Vector3(0, 0, 1));
    var cross = new THREE.Vector3(0, 0, 1).cross(this.velocity);
    // console.log(cross);

    if (cross.y <= 0) {
      rad = Math.PI + (Math.PI - rad);
    }

    var q = new THREE.Quaternion();
    q.setFromAxisAngle(this._obj.up, rad);
    return q;
  }

  public update(deltaTime, targetPosition: Vector3) {
    this.mixer.update(deltaTime);

    this._acceleration = targetPosition
      .clone()
      .sub(this._obj.position)
      .normalize()
      .multiplyScalar(0.8);

    //v = vo+at
    this._velocity = this.velocity.add(this.acceleration.multiplyScalar(deltaTime));
    //console.log(this._obj.position);

    // console.log(this.velocity);
    // x = vot+1/2at^2
    var pos = this.velocity
      .multiplyScalar(deltaTime)
      .add(this.acceleration.multiplyScalar((1 / 2) * deltaTime * deltaTime));

    var _q = this.calcRotation();
    this._obj.rotation.setFromQuaternion(_q);
    this._obj.position.add(pos);
  }
}

export { boidElement };
