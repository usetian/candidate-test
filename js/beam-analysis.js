"use strict";

/** ============================ Beam Analysis Data Type ============================ */

/**
 * Beam material specification.
 *
 * @param {String} name         Material name
 * @param {Object} properties   Material properties {EI : 0, GA : 0, ....}
 */
class Material {
  constructor(name, properties) {
    this.name = name;
    this.properties = properties;
  }
}

/**
 *
 * @param {Number} primarySpan          Beam primary span length
 * @param {Number} secondarySpan        Beam secondary span length
 * @param {Material} material           Beam material object
 */
class Beam {
  constructor(primarySpan, secondarySpan, material) {
    this.primarySpan = primarySpan;
    this.secondarySpan = secondarySpan;
    this.material = material;
  }
}

/** ============================ Beam Analysis Class ============================ */

class BeamAnalysis {
  constructor() {
    this.options = {
      condition: "simply-supported",
    };

    this.analyzer = {
      "simply-supported": new BeamAnalysis.analyzer.simplySupported(),
      "two-span-unequal": new BeamAnalysis.analyzer.twoSpanUnequal(),
    };
  }
  /**
   *
   * @param {Beam} beam
   * @param {Number} load
   */
  getDeflection(beam, load, condition) {
    var analyzer = this.analyzer[condition];

    if (analyzer) {
      return {
        beam: beam,
        load: load,
        equation: analyzer.getDeflectionEquation(beam, load),
      };
    } else {
      throw new Error("Invalid condition");
    }
  }
  getBendingMoment(beam, load, condition) {
    var analyzer = this.analyzer[condition];

    if (analyzer) {
      return {
        beam: beam,
        load: load,
        equation: analyzer.getBendingMomentEquation(beam, load),
      };
    } else {
      throw new Error("Invalid condition");
    }
  }
  getShearForce(beam, load, condition) {
    var analyzer = this.analyzer[condition];

    if (analyzer) {
      return {
        beam: beam,
        load: load,
        equation: analyzer.getShearForceEquation(beam, load),
      };
    } else {
      throw new Error("Invalid condition");
    }
  }
}

/** ============================ Beam Analysis Analyzer ============================ */

/**
 * Available analyzers for different conditions
 */
BeamAnalysis.analyzer = {};

/**
 * Calculate deflection, bending stress and shear stress for a simply supported beam
 *
 * @param {Beam}   beam   The beam object
 * @param {Number}  load    The applied load
 */
BeamAnalysis.analyzer.simplySupported = class {
  constructor(beam, load) {
    this.beam = beam;
    this.load = load;
  }
  getDeflectionEquation(beam, load) {
    const L = beam.primarySpan;
    const w = load;
    const EI = beam.material.properties.EI / 1e9;
    const j2 = beam.material.properties.j2 || 1;
    return function (x) {
      const term1 = (-w * x) / (24 * EI);
      const term2 = Math.pow(L, 3) - 2 * L * Math.pow(x, 2) + Math.pow(x, 3);
      return {
        x: x,
        y: term1 * term2 * j2 * 1000,
      };
    };
  }
  getBendingMomentEquation(beam, load) {
    const L = beam.primarySpan;
    const w = load;
    return function (x) {
      // rumus lentur
      return {
        x: x,
        y: -w * (x / 2) * (L - x),
      };
    };
  }
  getShearForceEquation(beam, load) {
    const L = beam.primarySpan;
    const w = load;
    return function (x) {
      // rumus gaya geser
      return {
        x: x,
        y: w * (L / 2 - x),
      };
    };
  }
};

/**
 * Calculate deflection, bending stress and shear stress for a beam with two spans of equal condition
 *
 * @param {Beam}   beam   The beam object
 * @param {Number}  load    The applied load
 */
BeamAnalysis.analyzer.twoSpanUnequal = class {
  constructor(beam, load) {
    this.beam = beam;
    this.load = load;
  }
  calculateReaction(beam, w) {
    const L1 = beam.primarySpan;
    const L2 = beam.secondarySpan;

    const M1 = -(w * Math.pow(L2, 3) + w * Math.pow(L1, 3)) / (8 * (L1 + L2));

    const R1 = M1 / L1 + (w * L1) / 2;
    const R3 = M1 / L2 + (w * L2) / 2;
    const R2 = w * L1 + w * L2 - R1 - R3;
    return {
      R1: R1,
      R2: R2,
      R3: R3,
      M1: M1,
      L1: L1,
      L2: L2,
    };
  }
  getDeflectionEquation(beam, load) {
    const w = load;
    const { R1, R2, R3, M1, L1, L2 } = this.calculateReaction(beam, w);
    const EI = beam.material.properties.EI / 1e9;
    const j2 = beam.material.properties.j2 || 1;

    return function (x) {
      let y_value = 0;

      if (x <= L1) {
        const term =
          4 * R1 * Math.pow(x, 2) -
          w * Math.pow(x, 3) +
          w * Math.pow(L1, 3) -
          4 * R1 * Math.pow(L1, 2);
        y_value = (x / (24 * EI)) * term * j2 * 1000;
      } else {
        const x_prime = x - L1;
        const term =
          ((R1 * x_prime) / 6) * (Math.pow(x_prime, 2) - Math.pow(L1, 2)) +
          ((R2 * x_prime) / 6) *
            (Math.pow(x_prime, 2) - 3 * L1 * x_prime + 3 * Math.pow(L1, 2)) -
          (R2 * Math.pow(L1, 3)) / 6 -
          ((w * x_prime) / 24) * (Math.pow(x_prime, 3) - Math.pow(L1, 3));
        y_value = -(term / EI) * j2 * 1000;
      }
      return { x: x, y: y_value };
    };
  }
  getBendingMomentEquation(beam, load) {
    const w = load;
    const { R1, R2, L1 } = this.calculateReaction(beam, w);
    return function (x) {
      let y_value = 0;
      if (x <= L1) {
        y_value = -(R1 * x - (w * Math.pow(x, 2)) / 2);
      } else {
        y_value = -(R1 * x + R2 * (x - L1) - (w * Math.pow(x, 2)) / 2);
      }
      return { x: x, y: y_value };
    };
  }
  getShearForceEquation(beam, load) {
    const w = load;
    const { R1, R2, L1 } = this.calculateReaction(beam, w);
    return function (x) {
      let y_value = 0;
      if (x < L1) {
        y_value = R1 - w * x;
      } else {
        y_value = R1 + R2 - w * x;
      }
      return { x: x, y: y_value };
    };
  }
};
