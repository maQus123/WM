/* umanu scripts | http://umanu.de/ */
'use strict';

(function($) {

var tools = {

    findTeam : function(teams, title) {
      var result = null;
      $.each(teams, function(i, team) {
        if (team.Title == title) {
          result = team;
        }
      });
      return result;
    },

    getArticle : function(group) {
      var groupId = group.Title.replace(' ', '-') + '-';
      var article = $(document.createElement('article')).append('<h1>' + group.Title + '</h1>');
      $.each(group.Matches, function(i, m) {
        var div = $(document.createElement('div')).appendTo(article);
        var title1 = "?";
        if (null != m.Team1) {
          title1 = m.Team1.Title;
        }
        var title2 = "?";
        if (null != m.Team2) {
          title2 = m.Team2.Title;
        }
        div.append('<span class="title">' + title1 + ' - ' + title2 + '</span>');
        if (m.Input1) {
          m.Input1.appendTo(div);
        } else {
          m.Input1 = tools.getInput(m.Score1, m.IsLocked).attr('id', groupId + i + '-' + 1).appendTo(div);
        }
        div.append('<span> : </span>');
        if (m.Input2) {
          m.Input2.appendTo(div);
        } else {
          m.Input2 = tools.getInput(m.Score2, m.IsLocked).attr('id', groupId + i + '-' + 2).appendTo(div);
        }
        return;
      });
      return article;
    },
    
    getHash : function(value) {
      var hash = 0;
      for (var i = 0; i < value.length; i++) {
        hash = ((hash << 5) - hash) + value.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    },
    
    getInput : function(score, isLocked) {
      var input = $('<input type="number" min="0" step="1" />');
      if (null != score) {
        input.val(score);
      }
      if (isLocked) {
        input.attr('disabled', 'disabled');
      }
      return input;
    },

    lockPlayedMatches : function(matches) {
      $.each(matches, function(i, m) {
        if (null == m.Score1 || null == m.Score2) {
          m.IsLocked = false;
        } else {
          m.IsLocked = true;
        }
        return;
      });
      return;
    },

    readInputs : function(matches) {
      $.each(matches, function(i, m) {
        var value1 = m.Input1.val();
        if (value1.length > 0) {
          m.Score1 = value1;
        } else {
          m.Score1 = null;
        }
        var value2 = m.Input2.val();
        if (value2.length > 0) {
          m.Score2 = value2;
        } else {
          m.Score2 = null;
        }
        return;
      });
      return;
    }
    
  };

  var methods = {

    init : function() {
      this.wm('loadData');
      return this;
    },

    loadData : function() {
      this.each(function() {
        var main = $(this);
        var data = games;
        data.Teams = teams;
        $.each(data.Groups, function(i, group) {
          tools.lockPlayedMatches(group.Matches);
          return;
        });
        tools.lockPlayedMatches(data.RoundOf16.Matches);
        tools.lockPlayedMatches(data.QuarterFinals.Matches);
        tools.lockPlayedMatches(data.SemiFinals.Matches);
        tools.lockPlayedMatches(data.Final.Matches);
        main.data('data', data);
        main.wm('updateGroups');
        $.each(data.Groups, function(i, group) {
          forecastResults(group.Matches, true);
          return;
        });
        main.wm('updateGroups');
        main.wm('updateRoundOf16');
        forecastResults(data.RoundOf16.Matches, false);
        main.wm('updateQuarterFinals');
        forecastResults(data.QuarterFinals.Matches, false);
        main.wm('updateSemiFinals');
        forecastResults(data.SemiFinals.Matches, false);
        main.wm('updateFinal');
        forecastResults(data.Final.Matches, false);
        main.wm('writeData');
        return;
      });
      return this;
    },

    readData : function() {
      this.each(function() {
        var main = $(this);
        var data = main.data('data');
        $.each(data.Groups, function(i, group) {
          tools.readInputs(group.Matches);
          return;
        });
        main.wm('updateGroups');
        main.wm('updateRoundOf16');
        tools.readInputs(data.RoundOf16.Matches);
        main.wm('updateQuarterFinals');
        tools.readInputs(data.QuarterFinals.Matches);
        main.wm('updateSemiFinals');
        tools.readInputs(data.SemiFinals.Matches);
        main.wm('updateFinal');
        tools.readInputs(data.Final.Matches);
        return;
      });
      return this;
    },

    updateFinal : function() {
      this.each(function() {
        var data = $(this).data('data');
        if (data.SemiFinals.Matches[0].Score1 > data.SemiFinals.Matches[0].Score2) {
          data.Final.Matches[0].Team1 = data.SemiFinals.Matches[0].Team1;
        } else {
          data.Final.Matches[0].Team1 = data.SemiFinals.Matches[0].Team2;
        }
        if (data.SemiFinals.Matches[1].Score1 > data.SemiFinals.Matches[1].Score2) {
          data.Final.Matches[0].Team2 = data.SemiFinals.Matches[1].Team1;
        } else {
          data.Final.Matches[0].Team2 = data.SemiFinals.Matches[1].Team2;
        }
        return;
      });
      return this;
    },

    updateGroups : function() {
      this.each(function() {
        var data = $(this).data('data');
        $.each(data.Groups, function(i, group) {
          var teams = [];
          $.each(group.Matches, function(j, m) {
            m.Team1 = tools.findTeam(teams, m.Title1);
            if (null == m.Team1) {
              m.Team1 = tools.findTeam(data.Teams, m.Title1);
              m.Team1.ScoredGoals = m.Team1.ConcededGoals = m.Team1.Points = 0;
              teams.push(m.Team1);
            }
            m.Team2 = tools.findTeam(teams, m.Title2);
            if (null == m.Team2) {
              m.Team2 = tools.findTeam(data.Teams, m.Title2);
              m.Team2.ScoredGoals = m.Team2.ConcededGoals = m.Team2.Points = 0;
              teams.push(m.Team2);
            }
            if (null != m.Score1 && null != m.Score2) {
              m.Team1.ScoredGoals += m.Score1;
              m.Team1.ConcededGoals += m.Score2;
              m.Team2.ScoredGoals += m.Score2;
              m.Team2.ConcededGoals += m.Score1;            
              if (m.Score1 > m.Score2) {
                m.Team1.Points += 3;
              } else if (m.Score1 < m.Score2) {
                m.Team2.Points += 3;
              } else {
                m.Team1.Points += 1;
                m.Team2.Points += 1;
              }
            }
            return;
          });
          teams.sort(function(a, b) {
            var r = b.Points - a.Points;
            if (0 == r) {
              var teamA = new Object();              
              var teamB = new Object();
              teamA.ScoredGoals = teamA.ConcededGoals = teamA.Points = teamB.ScoredGoals = teamB.ConcededGoals = teamB.Points = 0;
              $.each(group.Matches, function(j, m) {
                if (null != m.Score1 && null != m.Score2) {
                  if (m.Title1 == a.Title && m.Title2 == b.Title) {
                    teamA.ScoredGoals += m.Score1;
                    teamA.ConcededGoals += m.Score2;
                    teamB.ScoredGoals += m.Score2;
                    teamB.ConcededGoals += m.Score1;
                    if (m.Score1 > m.Score2) {
                      teamA.Points += 3;
                    } else if (m.Score1 < m.Score2) {
                      teamB.Points += 3;
                    } else {
                      teamA.Points += 1;
                      teamB.Points += 1;
                    }
                  } else if (m.Title1 == b.Title && m.Title2 == a.Title) {
                    teamA.ScoredGoals += m.Score2;
                    teamA.ConcededGoals += m.Score1;
                    teamB.ScoredGoals += m.Score1;
                    teamB.ConcededGoals += m.Score2;
                    if (m.Score2 > m.Score1) {
                      teamA.Points += 3;
                    } else if (m.Score2 < m.Score1) {
                      teamB.Points += 3;
                    } else {
                      teamA.Points += 1;
                      teamB.Points += 1;
                    }
                  }
                }
                return;
              });
              r = teamB.Points - teamA.Points; // Punkte im direkten Vergleich
              if (0 == r) {
                r = (teamB.ScoredGoals - teamB.ConcededGoals) - (teamA.ScoredGoals - teamA.ConcededGoals); // Tordifferenz im direkten Vergleich
                if (0 == r) {
                  r = teamB.ScoredGoals - teamA.ScoredGoals; // Tore im direkten Vergleich
                  if (0 == r) {
                    r = (b.ScoredGoals - b.ConcededGoals) - (a.ScoredGoals - a.ConcededGoals); // Tordifferenz aller Gruppenspiele
                    if (0 == r) {
                      r = b.ScoredGoals - a.ScoredGoals; // Tore aller Gruppenspiele
                      if (0 == r) {
                        console.log("Die Platzierungen in " + group.Title + " konnten nicht eindeutig ermittelt werden.");
                      }
                    }
                  }
                }
              }
            }
            return r;
          });
          group.Teams = teams;
          return;
        });
        return;
      });
      return this;
    },
    
    updateQuarterFinals : function() {
      this.each(function() {
        var data = $(this).data('data');
        if (data.RoundOf16.Matches[1].Score1 > data.RoundOf16.Matches[1].Score2) {
          data.QuarterFinals.Matches[0].Team1 = data.RoundOf16.Matches[1].Team1;
        } else {
          data.QuarterFinals.Matches[0].Team1 = data.RoundOf16.Matches[1].Team2;
        }
        if (data.RoundOf16.Matches[0].Score1 > data.RoundOf16.Matches[0].Score2) {
          data.QuarterFinals.Matches[0].Team2 = data.RoundOf16.Matches[0].Team1;
        } else {
          data.QuarterFinals.Matches[0].Team2 = data.RoundOf16.Matches[0].Team2;
        }
        if (data.RoundOf16.Matches[4].Score1 > data.RoundOf16.Matches[4].Score2) {
          data.QuarterFinals.Matches[1].Team1 = data.RoundOf16.Matches[4].Team1;
        } else {
          data.QuarterFinals.Matches[1].Team1 = data.RoundOf16.Matches[4].Team2;
        }
        if (data.RoundOf16.Matches[5].Score1 > data.RoundOf16.Matches[5].Score2) {
          data.QuarterFinals.Matches[1].Team2 = data.RoundOf16.Matches[5].Team1;
        } else {
          data.QuarterFinals.Matches[1].Team2 = data.RoundOf16.Matches[5].Team2;
        }
        if (data.RoundOf16.Matches[6].Score1 > data.RoundOf16.Matches[6].Score2) {
          data.QuarterFinals.Matches[2].Team1 = data.RoundOf16.Matches[6].Team1;
        } else {
          data.QuarterFinals.Matches[2].Team1 = data.RoundOf16.Matches[6].Team2;
        }
        if (data.RoundOf16.Matches[7].Score1 > data.RoundOf16.Matches[7].Score2) {
          data.QuarterFinals.Matches[2].Team2 = data.RoundOf16.Matches[7].Team1;
        } else {
          data.QuarterFinals.Matches[2].Team2 = data.RoundOf16.Matches[7].Team2;
        }
        if (data.RoundOf16.Matches[2].Score1 > data.RoundOf16.Matches[2].Score2) {
          data.QuarterFinals.Matches[3].Team1 = data.RoundOf16.Matches[2].Team1;
        } else {
          data.QuarterFinals.Matches[3].Team1 = data.RoundOf16.Matches[2].Team2;
        }
        if (data.RoundOf16.Matches[3].Score1 > data.RoundOf16.Matches[3].Score2) {
          data.QuarterFinals.Matches[3].Team2 = data.RoundOf16.Matches[3].Team1;
        } else {
          data.QuarterFinals.Matches[3].Team2 = data.RoundOf16.Matches[3].Team2;
        }
        return;
      });
      return this;
    },

    updateRoundOf16 : function() {
      this.each(function() {
        var data = $(this).data('data');
        data.RoundOf16.Matches[0].Team1 = data.Groups[2].Teams[0];
        data.RoundOf16.Matches[0].Team2 = data.Groups[3].Teams[1];
        data.RoundOf16.Matches[1].Team1 = data.Groups[0].Teams[0];
        data.RoundOf16.Matches[1].Team2 = data.Groups[1].Teams[1];
        data.RoundOf16.Matches[2].Team1 = data.Groups[1].Teams[0];
        data.RoundOf16.Matches[2].Team2 = data.Groups[0].Teams[1];
        data.RoundOf16.Matches[3].Team1 = data.Groups[3].Teams[0];
        data.RoundOf16.Matches[3].Team2 = data.Groups[2].Teams[1];
        data.RoundOf16.Matches[4].Team1 = data.Groups[4].Teams[0];
        data.RoundOf16.Matches[4].Team2 = data.Groups[5].Teams[1];
        data.RoundOf16.Matches[5].Team1 = data.Groups[6].Teams[0];
        data.RoundOf16.Matches[5].Team2 = data.Groups[7].Teams[1];
        data.RoundOf16.Matches[6].Team1 = data.Groups[5].Teams[0];
        data.RoundOf16.Matches[6].Team2 = data.Groups[4].Teams[1];
        data.RoundOf16.Matches[7].Team1 = data.Groups[7].Teams[0];
        data.RoundOf16.Matches[7].Team2 = data.Groups[6].Teams[1];
        return;
      });
      return this;
    },

    updateSemiFinals : function() {
      this.each(function() {
        var data = $(this).data('data');
        if (data.QuarterFinals.Matches[0].Score1 > data.QuarterFinals.Matches[0].Score2) {
          data.SemiFinals.Matches[0].Team1 = data.QuarterFinals.Matches[0].Team1;
        } else {
          data.SemiFinals.Matches[0].Team1 = data.QuarterFinals.Matches[0].Team2;
        }
        if (data.QuarterFinals.Matches[1].Score1 > data.QuarterFinals.Matches[1].Score2) {
          data.SemiFinals.Matches[0].Team2 = data.QuarterFinals.Matches[1].Team1;
        } else {
          data.SemiFinals.Matches[0].Team2 = data.QuarterFinals.Matches[1].Team2;
        }
        if (data.QuarterFinals.Matches[3].Score1 > data.QuarterFinals.Matches[3].Score2) {
          data.SemiFinals.Matches[1].Team1 = data.QuarterFinals.Matches[3].Team1;
        } else {
          data.SemiFinals.Matches[1].Team1 = data.QuarterFinals.Matches[3].Team2;
        }
        if (data.QuarterFinals.Matches[2].Score1 > data.QuarterFinals.Matches[2].Score2) {
          data.SemiFinals.Matches[1].Team2 = data.QuarterFinals.Matches[2].Team1;
        } else {
          data.SemiFinals.Matches[1].Team2 = data.QuarterFinals.Matches[2].Team2;
        }
        return;
      });
      return this;
    },
    
    writeData : function() {
      this.each(function() {
        var main = $(this);
        var data = main.data('data');
        $.each(data.Groups, function(i, group) {
          tools.getArticle(group).appendTo(main);
          return;
        });
        tools.getArticle(data.RoundOf16).appendTo(main);
        tools.getArticle(data.QuarterFinals).appendTo(main);
        tools.getArticle(data.SemiFinals).appendTo(main);
        tools.getArticle(data.Final).appendTo(main);
        $("input[type='number']").one('change', function() {
          var inputId = $(this).attr('id');
          main.wm('readData');
          main.children().remove();
          main.wm('writeData');
          $('#' + inputId).focus();
          return;
        });
        return;
      });
      return this;
    }

  };

  $.fn.wm = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error('Method ' +  method + ' does not exist on jQuery.wm.');
    }
  };

})(jQuery);

/* init */

$(function() {
  var script = 'forecast.js';
  var urlParts = window.location.search.split('?');
  if (2 == urlParts.length) {
    script = urlParts[1]
    console.log(script);
  }
  $.getScript(script, function() {
    $("div[role='main']").wm();
    return;
  });
  return;
});
