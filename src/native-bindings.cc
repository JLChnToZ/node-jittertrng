#include <nan.h>

extern "C" {
#include "../deps/jitterentropy-library/jitterentropy.h"
}

using namespace Nan;

class JitterTrng : public ObjectWrap {
 public:
  static NAN_MODULE_INIT(Init) {
    v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(New);
    tpl->SetClassName(Nan::New("JitterTrng").ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);
    Nan::SetPrototypeMethod(tpl, "read", ReadEntropy);
    constructor().Reset(Nan::GetFunction(tpl).ToLocalChecked());
    Nan::Set(
      target,
      Nan::New("JitterTrng").ToLocalChecked(),
      GetFunction(tpl).ToLocalChecked()
    );
    Nan::Set(
      target,
      Nan::New("init").ToLocalChecked(),
      Nan::New<v8::FunctionTemplate>(InitEngine)->GetFunction()
    );
  }

 private:
  explicit JitterTrng(unsigned int osr = 1, unsigned int flags = 0) {
    collector_ = jent_entropy_collector_alloc(osr, flags);
  }

  ~JitterTrng() {
    jent_entropy_collector_free(collector_);
  }

  static NAN_METHOD(New) {
    if (info.IsConstructCall()) {
      unsigned int osr = info[0]->IsUndefined() ? 1 : Nan::To<unsigned int>(info[0]).FromJust();
      unsigned int flags = info[1]->IsUndefined() ? 0 : Nan::To<unsigned int>(info[1]).FromJust();
      JitterTrng *obj = new JitterTrng(osr, flags);
      obj->Wrap(info.This());
      info.GetReturnValue().Set(info.This());
    } else {
      const int argc = 2;
      v8::Local<v8::Value> argv[argc] = { info[0], info[1] };
      v8::Local<v8::Function> cons = Nan::New(constructor());
      info.GetReturnValue().Set(cons->NewInstance(argc, argv));
    }
  }

  static NAN_METHOD(ReadEntropy) {
    JitterTrng* obj = Nan::ObjectWrap::Unwrap<JitterTrng>(info.Holder());
    char* buffer = (char*)node::Buffer::Data(info[0]->ToObject());
    size_t size = info[1]->IsUndefined() ? node::Buffer::Length(info[0]) : info[1]->Uint32Value();
    ssize_t result = jent_read_entropy(obj->collector_, buffer, size);
    info.GetReturnValue().Set(Nan::New((uint32_t)result));
  }

  static NAN_METHOD(InitEngine) {
    info.GetReturnValue().Set(Nan::New(jent_entropy_init()));
  }

  static inline Nan::Persistent<v8::Function> & constructor() {
    static Nan::Persistent<v8::Function> my_constructor;
    return my_constructor;
  }

  rand_data *collector_;
};

NODE_MODULE(objectwrapper, JitterTrng::Init)