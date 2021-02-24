import * as THREE from 'three';
import { MathUtils, RGBA_ASTC_10x10_Format, Scene, Vector3 } from 'three';
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils';

class boidElement {
  public rootObj: THREE.Object3D = new THREE.Object3D();
  public isShowVectorArrow: Boolean = new Boolean(false);

  _velocity = new Vector3(Math.random() - 0.2, 0, Math.random() - 0.2).normalize();
  _acceleration = new Vector3(Math.random() * 0.5, 0, Math.random() * 0.5);
  _boidObj: THREE.Object3D = new THREE.Object3D();
  _forward: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
  accelerationHelper;
  velocityHelper;
  scopeOfForceHelper;
  get boidObj(): THREE.Object3D {
    return this._boidObj;
  }
  private get velocity(): THREE.Vector3 {
    return this._velocity.clone();
  }
  private get acceleration(): THREE.Vector3 {
    return this._acceleration.clone();
  }

  private mixer;

  public async init(objData: THREE.Object3D) {
    await Promise.resolve(SkeletonUtils.clone(objData)).then((cloneObj) => {
      this._boidObj = cloneObj;

      this._boidObj.animations = objData.animations;
      this.mixer = new THREE.AnimationMixer(this.boidObj);
      this.mixer.timeScale = THREE.MathUtils.randFloat(1, 1.2);

      const action = this.mixer.clipAction(this.boidObj.animations[0]);
      action.setLoop(THREE.LoopRepeat);
      const material = new THREE.MeshPhongMaterial({ color: 'rgb(255, 0, 0)' });
      material.skinning = true;

      action.play();

      this.boidObj.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          (<THREE.Mesh>child).material = material;
        }
      });

      this.boidObj.scale.setScalar(0.05);
      this.boidObj.position.set(0, 0, 0);

      this.addDebugUtils();
    });

    //-------------set init params------------------------
    this.rootObj.position.set(
      THREE.MathUtils.randFloat(-10, 10),
      0,
      THREE.MathUtils.randFloat(-10, 10)
    );
    //------------------------------------------------------
  }

  public switchShowVector() {
    this.accelerationHelper.visible = !this.accelerationHelper.visible;
    this.velocityHelper.visible = !this.velocityHelper.visible;
  }

  public switchShowScopeOfForce() {
    this.scopeOfForceHelper.visible = !this.scopeOfForceHelper.visible;
  }

  calcRotation() {
    let dot = this.velocity.normalize().dot(new Vector3(0, 0, 1));
    var rad = Math.acos(dot);
    var cross = new THREE.Vector3(0, 0, 1).cross(this.velocity);

    if (cross.y <= 0) {
      rad = Math.PI + (Math.PI - rad);
    }

    var q = new THREE.Quaternion();
    q.setFromAxisAngle(this.boidObj.up, rad);
    return q;
  }

  separation(boids: boidElement[]): THREE.Vector3 {
    var vec = new THREE.Vector3(0, 0, 0);
    var count = 0;
    boids.forEach((element) => {
      if (this.rootObj == element.rootObj) return;

      var myPos = this.rootObj.position.clone();
      var elePos = element.rootObj.position.clone();
      var dif = elePos.sub(myPos).multiplyScalar(-1);
      var difLength = dif.length();

      if (difLength > 2) return;

      count += 1;
      vec.add(dif.normalize().divideScalar(difLength * difLength));
    });
    if (count == 0) return vec;

    return vec.divideScalar(count);
  }

  alignment(boids: boidElement[]): THREE.Vector3 {
    var vec = new THREE.Vector3(0, 0, 0);
    var count = 0;
    boids.forEach((element) => {
      if (this.rootObj == element.rootObj) return;

      var myPos = this.rootObj.position.clone();
      var elePos = element.rootObj.position.clone();
      var dif = elePos.sub(myPos);
      var difLength = dif.length();

      if (difLength > 2) return;

      count += 1;
      vec.add(element.velocity);
    });
    if (count == 0) return vec;

    var averageVelocity = vec.divideScalar(count);
    var myVelocity = this.velocity;
    return averageVelocity.sub(myVelocity);
  }

  cohesion(boids: boidElement[]): THREE.Vector3 {
    var vec = new THREE.Vector3(0, 0, 0);
    var count = 0;
    var myPos = this.rootObj.position.clone();

    boids.forEach((element) => {
      if (this.rootObj == element.rootObj) return;

      var elePos = element.rootObj.position.clone();
      var dif = elePos.sub(myPos);
      var difLength = dif.length();

      if (difLength > 2) return;

      count += 1;
      vec.add(elePos);
    });
    if (count == 0) return vec;

    var averagePos = vec.divideScalar(count);
    return averagePos.sub(myPos);
  }

  addDebugUtils() {
    this.accelerationHelper = new THREE.ArrowHelper(
      this.acceleration,
      this.rootObj.position,
      1,
      0xffff00,
      0.5,
      0.2
    );
    this.rootObj.attach(this.accelerationHelper);

    this.velocityHelper = new THREE.ArrowHelper(
      this.velocity,
      this.rootObj.position,
      1,
      0xff0000,
      0.5,
      0.2
    );
    this.rootObj.attach(this.velocityHelper);

    const radius = 2; //大きさ(半径)
    const radials = 1; //円周の分割線数
    const circles = 1; //半径の分割線数
    const divisions = 50; //○角形数(○が多いほど円に近づく)
    this.scopeOfForceHelper = new THREE.PolarGridHelper(
      radius,
      radials,
      circles,
      divisions,
      0xffffff,
      0xffffff
    );
    this.rootObj.add(this.scopeOfForceHelper);
    this.rootObj.attach(this.boidObj);

    this.accelerationHelper.visible = false;
    this.velocityHelper.visible = false;
    this.scopeOfForceHelper.visible = false;
  }

  public update(deltaTime, targetPosition, boids: boidElement[]) {
    this.mixer.update(deltaTime);

    this._acceleration = targetPosition.clone().sub(this.rootObj.position).multiplyScalar(0.1);

    var separation = this.separation(boids).multiplyScalar(15);
    var alignment = this.alignment(boids).multiplyScalar(2);
    var cohesion = this.cohesion(boids).multiplyScalar(1);

    this._acceleration.add(separation.add(alignment).add(cohesion));
    this._acceleration.divideScalar(18);

    this.accelerationHelper.setDirection(this.acceleration);
    this.accelerationHelper.setLength(this.acceleration.length(), 0.25, 0.2);

    this.velocityHelper.setDirection(this.velocity);
    this.velocityHelper.setLength(this.velocity.length(), 0.25, 0.2);

    //v = vo+at
    var beforeVelocity = this.velocity;
    this._velocity = this.velocity.add(this.acceleration.multiplyScalar(deltaTime));
    this._velocity.clampLength(0.4, 3);
    this.mixer.timeScale = THREE.MathUtils.mapLinear(this.velocity.length(), 0.4, 3, 0.8, 3);

    // x = vot+1/2at^2
    var pos = this.velocity
      .multiplyScalar(deltaTime)
      .add(this.acceleration.multiplyScalar(0.5 * deltaTime * deltaTime));

    this.boidObj.rotation.setFromQuaternion(this.calcRotation());
    this.rootObj.position.add(pos);
  }
}

export { boidElement };
