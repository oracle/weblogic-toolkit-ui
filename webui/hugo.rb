class Hugo < Formula
  desc "Configurable static site generator"
  homepage "https://gohugo.io/"
  url "https://github.com/gohugoio/hugo/archive/refs/tags/v0.146.2.tar.gz"
  sha256 "a7307b7e34f6247b113e3d85383a9b10beb43a19dccf8aa929b26878c040221d"
  license "Apache-2.0"
  head "https://github.com/gohugoio/hugo.git", branch: "master"

  livecheck do
    url :stable
    regex(/^v?(\d+(?:\.\d+)+)$/i)
  end

  bottle do
    sha256 cellar: :any_skip_relocation, arm64_sequoia: "b9960f1ef2b7cbda75a725f45c6687531a5ae02d4189b21ff752625a77a0e92f"
    sha256 cellar: :any_skip_relocation, arm64_sonoma:  "e47c0daa963a71cb7585229f5762cd12e2c820cade65f20a62621d277347d039"
    sha256 cellar: :any_skip_relocation, arm64_ventura: "819cd6f359e64232584facbf8abc5654b36e09da16bb2eb3b7d03fb04854f66d"
    sha256 cellar: :any_skip_relocation, sonoma:        "f055ccdaddb9c5e3327ea379d87e9a4a7f295105db8f75c2372207d00fb4055d"
    sha256 cellar: :any_skip_relocation, ventura:       "8c24b5f38af0a36964f6419d807f465524edd4ccc949682793cbb38410a8293e"
    sha256 cellar: :any_skip_relocation, arm64_linux:   "4cc7ef0fd40decd2a569f7542294b92046c69d659f8d4c90771bbad65f10e34c"
    sha256 cellar: :any_skip_relocation, x86_64_linux:  "5daf12d8be58ef026d30c1d9a8d79c05c866b2f4786738a29538355cb32b3d0d"
  end

  depends_on "go" => :build

  def install
    ldflags = %W[
      -s -w
      -X github.com/gohugoio/hugo/common/hugo.commitHash=#{tap.user}
      -X github.com/gohugoio/hugo/common/hugo.buildDate=#{time.iso8601}
      -X github.com/gohugoio/hugo/common/hugo.vendorInfo=brew
    ]
    tags = %w[extended withdeploy]
    system "go", "build", *std_go_args(ldflags:, tags:)

    generate_completions_from_executable(bin/"hugo", "completion")
    system bin/"hugo", "gen", "man", "--dir", man1
  end

  test do
    site = testpath/"hops-yeast-malt-water"
    system bin/"hugo", "new", "site", site
    assert_path_exists site/"hugo.toml"

    assert_match version.to_s, shell_output(bin/"hugo version")
  end
end
