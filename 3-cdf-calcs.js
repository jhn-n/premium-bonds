// class to create CDF from PMF
// provides P(At least) and percentiles as methods

class CDF {
  constructor(pmf) {
    this.cdf = new Map();
    this.cdf.set(0, pmf.get(0) ?? 0);
    const topPrize = user.brackets.at(-1);
    const secPrize = user.brackets.at(-2);

    switch (bracketCapType) {
      case 0:
        const highestKey = Math.max(...pmf.keys());
        for (let v = 25; v <= highestKey; v += 25) {
          this.cdf.set(v, this.F(v - 25) + (pmf.get(v) ?? 0));
        }
        break;
      case 1:
        for (let v = 25; v <= topPrize; v += 25) {
          this.cdf.set(v, this.F(v - 25) + (pmf.get(v) ?? 0));
        }
        break;
      case 2:
        for (let v = 25; v <= secPrize; v += 25) {
          this.cdf.set(v, this.F(v - 25) + (pmf.get(v) ?? 0));
        }
        this.cdf.set(topPrize, this.F(secPrize) + (pmf.get(topPrize) ?? 0));
        break;
    }
  }

  F(x) {
    return this.cdf.get(x) ?? NaN;
  }

  probAtLeast(x) {
    if (x === 0) return 1;
    if (bracketCapType === 2 && x === user.brackets.at(-1)) {
      return 1 - (this.F(user.brackets.at(-2)) ?? 0);
    }
    return 1 - (this.F(x - 25) ?? 0);
  }

  getPercentile(percentile) {
    const percentage = percentile / 100;
    if (this.cdf.get(0) >= percentage) return 0;

    const bracketCap = user.brackets.at(-2);
    if (this.cdf.get(bracketCap) < percentage) {
      console.error("Using too high percentiles for banding type 2");
    }

    // binary search for lowest x with F(x) >= target
    // this is where the percentile lies (represented by high)
    let low = 0;
    let high = bracketCap;
    while (high - low > 25) {
      const mid = 25 * Math.round((high + low) / 50);
      if (this.cdf.get(mid) >= percentage) {
        high = mid;
      } else {
        low = mid;
      }
    }
    return high;
  }
}
