function bootstrap(id, portletId) {

	var module = angular.module(id, ["app.factories"]);

	// http://fdietz.github.io/recipes-with-angular-js/directives/passing-configuration-params-using-html-attributes.html
	module.directive('i18n', function() {
		return {
			restrict: 'A',
			link: function(scope, element, attributes) {
				var message = Liferay.Language.get(attributes["i18n"]);
				element.html(message);
			}
		}
	});

	// Define scope in this way to avoid 'Unknown provider' problem
	//      https://groups.google.com/forum/#!msg/angular/_EMeX_Dci2U/xQuDwWadCrsJ
	module.controller("MainCtrl", ['$scope', '$rootScope', '$http', '$timeout', 'urlFactory', 'bookmarkFactory', 'releaseFactory',
		function($scope, $rootScope, $http, $timeout, urlFactory, bookmarkFactory, releaseFactory) {
			$scope.id = id;
			$scope.portletId = portletId.substr(1, portletId.length - 2);

			$scope.page = urlFactory.create($scope.portletId, 'list');

			// Getting Liferay stuff in Javascript
			// http://www.marconapolitano.it/en/liferay/39-how-to-use-liferay-themedisplay-object-with-javascript.html
			$scope.model = {
				currentBookmark: {},
				token: Liferay.authToken,
				companyId: Liferay.ThemeDisplay.getCompanyId(),
				loggedIn: Liferay.ThemeDisplay.isSignedIn()
			}

			bookmarkFactory.getBookmarks().then(function(bookmarks) {
				$scope.model.bookmarks = bookmarks;
			});

			releaseFactory.getRelease($scope.portletId).then(function(release) {
				$scope.model.release = release;
			});

			$scope.main = function() {
				$scope.model.currentBookmark = {};
				$scope.page = urlFactory.create($scope.portletId, 'list');
				$scope.reload();
			}

			$scope.detail = function(bookmark) {
				$scope.model.currentBookmark = bookmark;
				$scope.page = urlFactory.create($scope.portletId, 'detail');
			}

			$scope.add = function() {
				$scope.model.currentBookmark = {};
				$scope.page = urlFactory.create($scope.portletId, 'add');
			}

			$scope.store = function() {
				bookmarkFactory.addBookmark($scope.model.currentBookmark).then(function(result) {
					Liferay.fire('reloadBookmarks', { portletId: $scope.portletId });
					$scope.main();
				});
			}

			$scope.save = function() {
				bookmarkFactory.saveBookmark($scope.model.currentBookmark).then(function(result) {
					Liferay.fire('reloadBookmarks', { portletId: $scope.portletId });
					$scope.main();
				});
			}

			$scope.delete = function(bookmark) {
				bookmarkFactory.deleteBookmark(bookmark).then(function(result) {
					Liferay.fire('reloadBookmarks', { portletId: $scope.portletId });
					$scope.main();
				});
			}

			$scope.reload = function() {
				$timeout(function() {
					bookmarkFactory.getBookmarks().then(function(bookmarks) {
						$scope.model.bookmarks = bookmarks;
					});
				});
			}

			Liferay.on('reloadBookmarks', function(event) {
				// Filter out event if we triggered it in this portlet instance
				if (event.portletId != $scope.portletId) {
					$scope.reload();
				}
			});
		}]
	);

	// Don't use 'ng-app', but bootstrap Angular ourselves, so we can control
	// naming and scoping when portlet is instanceable
	//      http://stackoverflow.com/questions/18571301/angularjs-multiple-ng-app-within-a-page
	//      http://docs.angularjs.org/guide/bootstrap
	angular.bootstrap(document.getElementById(id),[id]);
}