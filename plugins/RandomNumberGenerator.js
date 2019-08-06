var mt_rng = (function() {
    
    var MersenneTwister = (function() {
        function MersenneTwister(seed) {
          if (seed == undefined) {
            seed = new Date().getTime();
          } 
          /* Period parameters */  
          this.N = 624;
          this.M = 397;
          this.MATRIX_A = 0x9908b0df;   /* constant vector a */
          this.UPPER_MASK = 0x80000000; /* most significant w-r bits */
          this.LOWER_MASK = 0x7fffffff; /* least significant r bits */
         
          this.mt = new Array(this.N); /* the array for the state vector */
          this.mti=this.N+1; /* mti==N+1 means mt[N] is not initialized */

          this.init_genrand(seed);
        }  
         
        /* initializes mt[N] with a seed */
        MersenneTwister.prototype.init_genrand = function(s) {
          this.mt[0] = s >>> 0;
          for (this.mti=1; this.mti<this.N; this.mti++) {
              var s = this.mt[this.mti-1] ^ (this.mt[this.mti-1] >>> 30);
           this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253)
          + this.mti;
              /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
              /* In the previous versions, MSBs of the seed affect   */
              /* only MSBs of the array mt[].                        */
              /* 2002/01/09 modified by Makoto Matsumoto             */
              this.mt[this.mti] >>>= 0;
              /* for >32 bit machines */
          }
        };
        
        /* generates a random number on [0,0xffffffff]-interval */
        MersenneTwister.prototype.genrand_int32 = function() {
          var y;
          var mag01 = new Array(0x0, this.MATRIX_A);
          /* mag01[x] = x * MATRIX_A  for x=0,1 */

          if (this.mti >= this.N) { /* generate N words at one time */
            var kk;

            if (this.mti == this.N+1)   /* if init_genrand() has not been called, */
              this.init_genrand(5489); /* a default initial seed is used */

            for (kk=0;kk<this.N-this.M;kk++) {
              y = (this.mt[kk]&this.UPPER_MASK)|(this.mt[kk+1]&this.LOWER_MASK);
              this.mt[kk] = this.mt[kk+this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
            }
            for (;kk<this.N-1;kk++) {
              y = (this.mt[kk]&this.UPPER_MASK)|(this.mt[kk+1]&this.LOWER_MASK);
              this.mt[kk] = this.mt[kk+(this.M-this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
            }
            y = (this.mt[this.N-1]&this.UPPER_MASK)|(this.mt[0]&this.LOWER_MASK);
            this.mt[this.N-1] = this.mt[this.M-1] ^ (y >>> 1) ^ mag01[y & 0x1];

            this.mti = 0;
          }

          y = this.mt[this.mti++];

          /* Tempering */
          y ^= (y >>> 11);
          y ^= (y << 7) & 0x9d2c5680;
          y ^= (y << 15) & 0xefc60000;
          y ^= (y >>> 18);

          return y >>> 0;
        };
        
        /* generates a random number on [0,1)-real-interval */
        MersenneTwister.prototype.random = function() {
          return this.genrand_int32()*(1.0/4294967296.0); 
          /* divided by 2^32 */
        };
        
        return MersenneTwister;
    })();
    
    function mt_rng(seed = null) {
        if(seed === null) {
            seed = new Date().getTime();
        }
        this.seed(seed);
    };
    
    mt_rng.prototype.seed = function(seed) {
        this._seed = seed;
        this._mt = new MersenneTwister(seed);
    };
    
    mt_rng.prototype.randint = function(min, max = null) {
        if(max === null) {
            max = min;
            min = 0;
        }
        return Math.floor(this._mt.random() * (max - min + 1)) + min;
    };
    
    return mt_rng;
    
})();
