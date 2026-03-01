import Map "mo:core/Map";
import Array "mo:core/Array";
import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Principal "mo:core/Principal";

actor {
  type Trade = {
    owner : Principal;
    id : Text;
    amount : Float;
    note : Text;
    tradeType : Text;
    date : Text;
    timestamp : Int;
  };

  module Trade {
    public func compareByTimestampDesc(t1 : Trade, t2 : Trade) : Order.Order {
      Int.compare(t2.timestamp, t1.timestamp);
    };
  };

  type Stats = {
    totalWins : Float;
    totalLosses : Float;
    netPL : Float;
    winCount : Nat;
    lossCount : Nat;
    consecutiveLosses : Nat;
  };

  let trades = Map.empty<Text, Trade>();

  public shared ({ caller }) func addTrade(amount : Float, note : Text, tradeType : Text, date : Text) : async Text {
    if (amount == 0.0) { Runtime.trap("Amount cannot be zero") };
    if (tradeType != "win" and tradeType != "loss") { Runtime.trap("Invalid tradeType") };

    let timestamp = Time.now();
    let id = timestamp.toText();

    let trade : Trade = {
      owner = caller;
      id;
      amount;
      note;
      tradeType;
      date;
      timestamp;
    };

    trades.add(id, trade);
    id;
  };

  public query ({ caller }) func getTrades() : async [Trade] {
    let userTrades = trades.values().toArray().filter(
      func(trade) { trade.owner == caller }
    );
    userTrades.sort(Trade.compareByTimestampDesc);
  };

  public query ({ caller }) func getTradesByDateRange(startDate : Text, endDate : Text) : async [Trade] {
    let userTrades = trades.values().toArray().filter(
      func(trade) {
        trade.owner == caller and trade.date >= startDate and trade.date <= endDate
      }
    );
    userTrades.sort(Trade.compareByTimestampDesc);
  };

  public shared ({ caller }) func deleteTrade(id : Text) : async () {
    switch (trades.get(id)) {
      case (null) { Runtime.trap("Trade does not exist") };
      case (?trade) {
        if (trade.owner != caller) { Runtime.trap("Unauthorized") };
        trades.remove(id);
      };
    };
  };

  public query ({ caller }) func getStats() : async Stats {
    let userTrades = trades.values().toArray().filter(
      func(trade) { trade.owner == caller }
    );

    var totalWins = 0.0;
    var totalLosses = 0.0;
    var winCount = 0;
    var lossCount = 0;
    var consecutiveLosses = 0;
    var lastWasLoss = true;

    userTrades.reverse().forEach(
      func(trade) {
        switch (trade.tradeType) {
          case ("win") {
            totalWins += trade.amount;
            winCount += 1;
            lastWasLoss := false;
          };
          case ("loss") {
            totalLosses += trade.amount;
            lossCount += 1;
            if (lastWasLoss) {
              consecutiveLosses += 1;
            } else {
              consecutiveLosses := 1;
            };
            lastWasLoss := true;
          };
          case (_) {};
        };
      }
    );

    {
      totalWins;
      totalLosses;
      netPL = totalWins - totalLosses;
      winCount;
      lossCount;
      consecutiveLosses;
    };
  };
};
