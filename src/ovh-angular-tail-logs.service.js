(function () {
    "use strict";

    angular.module("ovh-angular-tail-logs").factory("OvhTailLogs", function ($q, $timeout, $http) {

        var OvhTailLogs = function (opts) {
            var funcSource = opts.source || angular.noop;

            this.logs = [];
            this.delay = opts.delay || 1000;

            this.__getFuncSource = function () {
                return $q.when(funcSource());
            };

            this.source = this.__getFuncSource().then(function (source) {
                return source;
            });
        };

        OvhTailLogs.prototype.log = function () {
            var self = this;

            return self.source.then(function (source) {
                return $http.get(source + "&sort=asc&limit=1000");
            }).then(function (response) {
                var tmpArray = self.logs;
                tmpArray.push(response.data.messages);

                self.logs = _.uniq(_.flatten(tmpArray), function (log) {
                    return log.message._id;
                });

                return self.logs;
            })["catch"](function (err) {
                if (err.status === 410) {
                    self.source = self.__getFuncSource();
                    return self.source.then(function () {
                        return self.log();
                    });
                }
            })["finally"](function () {
                self.timer = $timeout(function () {
                    self.log.call(self);
                }, self.delay);
                return self.logs;
            });
        };

        OvhTailLogs.prototype.stop = function () {
            var self = this;
            if (self.timer) {
                $timeout.cancel(self.timer);
            }
            return $q.when(self);
        };

        return OvhTailLogs;
    });
})();
