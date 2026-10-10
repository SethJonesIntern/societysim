from typer.testing import CliRunner

from societysim import __version__
from societysim.cli import app


def test_version_command():
    result = CliRunner().invoke(app, ["version"])
    assert result.exit_code == 0
    assert __version__ in result.stdout
